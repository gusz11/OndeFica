import type { components } from "./api.generated";

// Generated directly from Pydantic/OpenAPI. Do not duplicate API shapes by hand.
export type User = components["schemas"]["UserResponse"];
export type Trip = components["schemas"]["TripResponse"];
export type TripCreate = components["schemas"]["TripCreate"];
export type Token = components["schemas"]["Token"];
export type Place = components["schemas"]["Place"];
export type Hotel = components["schemas"]["Hotel"];
export type ItineraryItem = components["schemas"]["ItineraryItemResponse"];
export type ItineraryCreate = components["schemas"]["ItineraryItemCreate"];
export type ItineraryUpdate = components["schemas"]["ItineraryItemUpdate"];
export type Favorite = components["schemas"]["FavoritePlaceResponse"];
export type ItemType = components["schemas"]["ItineraryItemType"];
export type DistanceUnit = "km" | "miles";
export type ModalProps = { visible: boolean; onClose: () => void };
