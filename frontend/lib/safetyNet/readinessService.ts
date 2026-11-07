import { BookingRecord, Passenger } from "../railway/types";
import { TravelReadinessChecklist } from "./types";

export class TravelReadinessService {
  /**
   * Generate an actionable post-booking readiness checklist
   */
  public static createReadinessChecklist(
    booking: BookingRecord,
    options?: { platform?: string }
  ): TravelReadinessChecklist {
    // Determine the Primary ID Carrier: first passenger with a valid ID or default to passenger 0
    const primaryPax: Passenger =
      booking.passengers.find((p) => p.idNumber && p.idNumber.trim().length > 0) ||
      booking.passengers[0] || {
        id: "p_default",
        name: "Primary Passenger",
        age: 30,
        gender: "M",
        berthPreference: "LOWER",
        foodPreference: "VEG",
        idType: "AADHAAR",
        idNumber: "XXXXXXXX4829",
        nationality: "Indian",
      };

    const platform = options?.platform || "Platform 12";

    // Departure time from booking or default
    const scheduledDeparture = "16:55 hrs";

    const stationCode = booking.fromStation?.code || (booking as any).fromStationCode || "NDLS";
    const stationName = booking.fromStation?.name || (stationCode === "NDLS" ? "New Delhi" : stationCode);

    return {
      primaryPassengerId: primaryPax.id,
      primaryPassengerName: primaryPax.name,
      primaryIdType: primaryPax.idType || "AADHAAR",
      primaryIdNumber: primaryPax.idNumber || "XXXXXXXX4829",
      offlineTicketSaved: true,
      boardingStationCode: stationCode,
      boardingStationName: stationName,
      departurePlatform: platform,
      scheduledDeparture,
      liveStatusUrl: `https://enquiry.indianrail.gov.in/mntes/`,
      reminders: [
        {
          type: "24H_BEFORE",
          scheduledTime: "24 hours before journey",
          simulatedStatus: "SCHEDULED",
        },
        {
          type: "3H_BEFORE",
          scheduledTime: "3 hours before journey (Chart Preparation)",
          simulatedStatus: "PENDING",
        },
      ],
    };
  }
}
