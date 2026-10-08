import { useCallback, useState } from "react";
import { useAsyncAction } from "./useAsyncAction";
import { nextDay, parseISODate, toISODate } from "../utils/dates";

export function useVisitForm(
  initialDate?: string | null,
  initialPeople?: number | null,
) {
  const [date, setDate] = useState(initialDate ?? toISODate(new Date()));
  const [people, setPeople] = useState(String(initialPeople ?? 1));
  const action = useAsyncAction();
  const save = (submit: (date: string, people: number) => Promise<void>) =>
    action.run(async () => {
      if (!parseISODate(date)) throw new Error("Informe uma data válida.");
      if (!/^\d+$/.test(people) || Number(people) < 1 || Number(people) > 1000)
        throw new Error("Informe de 1 a 1000 pessoas.");
      await submit(date, Number(people));
    });
  return { date, setDate, people, setPeople, save, ...action };
}
export function useHotelForm(
  initialIn?: string | null,
  initialOut?: string | null,
) {
  const [checkIn, setCheckIn] = useState(initialIn ?? toISODate(new Date()));
  const [checkOut, setCheckOut] = useState(
    initialOut ?? toISODate(nextDay(new Date())),
  );
  const changeCheckIn = useCallback(
    (value: string) => {
      setCheckIn(value);
      const date = parseISODate(value);
      if (date && (!parseISODate(checkOut) || checkOut <= value))
        setCheckOut(toISODate(nextDay(date)));
    },
    [checkOut],
  );
  const action = useAsyncAction();
  const save = (submit: (checkIn: string, checkOut: string) => Promise<void>) =>
    action.run(async () => {
      if (
        !parseISODate(checkIn) ||
        !parseISODate(checkOut) ||
        checkOut <= checkIn
      )
        throw new Error(
          "Informe datas válidas, com check-out posterior ao check-in.",
        );
      await submit(checkIn, checkOut);
    });
  return {
    checkIn,
    setCheckIn: changeCheckIn,
    checkOut,
    setCheckOut,
    save,
    ...action,
  };
}
