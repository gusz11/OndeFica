from BackEnd.tests.test_api import hotel, register, visit
from fastapi.testclient import TestClient


def test_trip_isolation_period_and_delete(client: TestClient) -> None:
    owner = register(client)
    other = register(client, "other@example.com")
    trip = client.post(
        "/trips/",
        headers=owner,
        json={"name": "Fim de semana", "start_date": "2026-10-12", "end_date": "2026-10-15"},
    ).json()
    ident = trip["id"]
    assert client.get("/trips/", headers=other).json() == []
    assert client.patch(f"/trips/{ident}", headers=other, json={"name": "Outro"}).status_code == 404
    assert client.post("/itinerary/", headers=other, json=visit(trip_id=ident)).status_code == 404
    assert (
        client.post(
            "/itinerary/", headers=owner, json=visit(trip_id=ident, visit_date="2026-10-16")
        ).status_code
        == 409
    )
    assert client.post("/itinerary/", headers=owner, json=visit(trip_id=ident)).status_code == 201
    assert (
        client.patch(f"/trips/{ident}", headers=owner, json={"start_date": "2026-10-13"}).status_code == 409
    )
    assert client.delete(f"/trips/{ident}", headers=other).status_code == 404
    assert client.delete(f"/trips/{ident}", headers=owner).status_code == 204
    assert client.get("/itinerary/", headers=owner).json() == []


def test_schedule_and_atomic_day_order(client: TestClient) -> None:
    owner = register(client)
    first = client.post(
        "/itinerary/", headers=owner, json=visit(start_time="09:00", duration_minutes=60)
    ).json()
    second = client.post("/itinerary/", headers=owner, json=visit()).json()
    path = f"/trips/{first['trip_id']}/days/2026-10-12/order"
    assert client.post(path, headers=owner, json={"item_ids": [second["id"]]}).status_code == 409
    response = client.post(path, headers=owner, json={"item_ids": [second["id"], first["id"]]})
    assert response.status_code == 200, response.text
    assert [(x["id"], x["sort_order"]) for x in response.json()] == [(second["id"], 0), (first["id"], 1)]
    assert client.post(path, headers=owner, json={"item_ids": [first["id"], first["id"]]}).status_code == 422
    assert (
        client.post(
            path.replace("10-12", "10-13"), headers=owner, json={"item_ids": [first["id"]]}
        ).status_code
        == 409
    )
    for changes in [
        {"start_time": "24:00", "duration_minutes": 60},
        {"start_time": "23:30", "duration_minutes": 60},
        {"start_time": "09:00"},
        {"duration_minutes": 0},
    ]:
        assert client.post("/itinerary/", headers=owner, json=visit(**changes)).status_code == 422
    assert (
        client.patch(
            f"/itinerary/{first['id']}", headers=owner, json={"start_time": None, "duration_minutes": None}
        ).status_code
        == 200
    )


def test_alternative_trips_do_not_conflict(client: TestClient) -> None:
    owner = register(client)
    trips = [
        client.post("/trips/", headers=owner, json={"name": name}).json()["id"]
        for name in ["Plano A", "Plano B"]
    ]
    for trip_id in trips:
        assert (
            client.post("/itinerary/", headers=owner, json={**hotel(), "trip_id": trip_id}).status_code == 201
        )
    assert client.post("/itinerary/", headers=owner, json={**hotel(), "trip_id": trips[0]}).status_code == 409
