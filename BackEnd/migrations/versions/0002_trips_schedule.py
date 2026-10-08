"""Add trips and visit scheduling, preserving existing bookings and import markers."""

import sqlalchemy as sa
from alembic import op
from BackEnd.models import Trip

revision: str = "0002_trips_schedule"
down_revision: str | None = "0001_initial"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    connection = op.get_bind()
    Trip.__table__.create(connection, checkfirst=True)
    names = {column["name"] for column in sa.inspect(connection).get_columns("itinerary_items")}
    if "trip_id" not in names:
        if connection.dialect.name == "sqlite":
            # ALTER in place avoids rebuilding a table referenced by legacy import markers.
            connection.exec_driver_sql(
                "ALTER TABLE itinerary_items ADD COLUMN trip_id INTEGER REFERENCES trips(id)"
            )
        else:
            op.add_column("itinerary_items", sa.Column("trip_id", sa.Integer(), nullable=True))
            op.create_foreign_key("fk_item_trip", "itinerary_items", "trips", ["trip_id"], ["id"])
    for column in (
        sa.Column("start_time", sa.String(5), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    ):
        if column.name not in names:
            op.add_column("itinerary_items", column)
    indexes = sa.inspect(connection).get_indexes("itinerary_items")
    if not any(index["column_names"] == ["trip_id"] for index in indexes):
        op.create_index("ix_itinerary_items_trip_id", "itinerary_items", ["trip_id"])
    owners = (
        connection.execute(sa.text("SELECT DISTINCT user_id FROM itinerary_items WHERE trip_id IS NULL"))
        .scalars()
        .all()
    )
    for owner in owners:
        if not connection.execute(sa.text("SELECT id FROM users WHERE id=:owner"), {"owner": owner}).first():
            raise RuntimeError("Programação legada sem proprietário válido; revise antes da migração.")
        trip_id = connection.execute(
            sa.text("SELECT id FROM trips WHERE user_id=:owner ORDER BY id"), {"owner": owner}
        ).scalar()
        if trip_id is None:
            trip_id = connection.execute(
                sa.insert(Trip.__table__).values(user_id=owner, name="Minha viagem").returning(Trip.id)
            ).scalar_one()
        connection.execute(
            sa.text("UPDATE itinerary_items SET trip_id=:trip WHERE user_id=:owner AND trip_id IS NULL"),
            {"trip": trip_id, "owner": owner},
        )
    # Stable ordering for data created before this feature; no dates or bookings are changed.
    if "sort_order" not in names:
        rows = connection.execute(
            sa.text(
                "SELECT id, trip_id, COALESCE(visit_date, check_in_date) AS day FROM itinerary_items ORDER BY id"
            )
        ).mappings()
        positions: dict[tuple[int, str], int] = {}
        for row in rows:
            key = (row["trip_id"], row["day"])
            position = positions.get(key, 0)
            connection.execute(
                sa.text("UPDATE itinerary_items SET sort_order=:position WHERE id=:id"),
                {"position": position, "id": row["id"]},
            )
            positions[key] = position + 1


def downgrade() -> None:
    raise RuntimeError(
        "Não é possível remover viagens sem perder a organização dos roteiros. Restaure um backup explicitamente."
    )
