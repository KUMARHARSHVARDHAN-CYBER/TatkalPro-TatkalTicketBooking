import { Passenger, QuotaCode } from "../railway/types";
import { GroupBatch, GroupSplitPlan, PlanBAlternative } from "./types";

export class GroupSplitCoordinator {
  /**
   * Split a large passenger list (>4) into compliant Tatkal booking batches (<= 4 pax per PNR)
   */
  public static splitGroup(
    passengers: Passenger[],
    options?: {
      coachTogether?: boolean;
      quota?: QuotaCode;
      classCode?: string;
      trainNumber?: string;
      trainName?: string;
    }
  ): GroupSplitPlan {
    const total = passengers.length;
    const coachTogether = options?.coachTogether ?? true;
    const quota = options?.quota ?? "TATKAL";
    const classCode = options?.classCode ?? "3A";

    const batches: GroupBatch[] = [];
    const maxPerPnr = 4;

    // Distribute passengers evenly across batches
    const numBatches = Math.ceil(total / maxPerPnr);
    const baseSize = Math.floor(total / numBatches);
    let remainder = total % numBatches;

    let pIndex = 0;
    for (let b = 0; b < numBatches; b++) {
      const currentBatchSize = baseSize + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      const batchPax = passengers.slice(pIndex, pIndex + currentBatchSize);
      pIndex += currentBatchSize;

      const randomPnr = `${Math.floor(2000000000 + Math.random() * 8000000000)}`;
      batches.push({
        batchNumber: b + 1,
        pnrMock: randomPnr,
        passengers: batchPax,
        classCode,
        quota,
        status: "READY",
      });
    }

    // Generate intelligent Plan B alternatives if seats become tight
    const planBAlternatives: PlanBAlternative[] = [
      {
        trainNumber: "12954",
        trainName: "August Kranti Tejas Rajdhani",
        departureTime: "17:15 (20 mins later)",
        classCode: "3A",
        availableSeats: 24,
        waitlistProbability: 96,
        fareDifference: 0,
      },
      {
        trainNumber: options?.trainNumber || "12952",
        trainName: `${options?.trainName || "Mumbai Rajdhani"} (Class Upgrade)`,
        departureTime: "16:55 (Same Train)",
        classCode: "2A",
        availableSeats: 16,
        waitlistProbability: 100,
        fareDifference: 650,
      },
      {
        trainNumber: "12904",
        trainName: "Golden Temple Mail (Via NZM)",
        departureTime: "07:20 (Morning Express)",
        classCode: "3A",
        availableSeats: 48,
        waitlistProbability: 92,
        fareDifference: -450,
      },
    ];

    return {
      totalPassengers: total,
      batches,
      coachTogetherPreference: coachTogether,
      planBAlternatives,
    };
  }

  /**
   * Simulate a realistic partial success scenario (Batch 1 confirms, Batch 2 encounters Tatkal exhaustion)
   */
  public static simulatePartialSuccess(plan: GroupSplitPlan): {
    updatedPlan: GroupSplitPlan;
    recoveryNotice: string;
    suggestedPlanB: PlanBAlternative;
  } {
    const updatedPlan: GroupSplitPlan = JSON.parse(JSON.stringify(plan));

    if (updatedPlan.batches.length >= 2) {
      updatedPlan.batches[0].status = "CONFIRMED";
      updatedPlan.batches[1].status = "WAITLISTED";
    } else if (updatedPlan.batches.length === 1) {
      updatedPlan.batches[0].status = "CONFIRMED";
    }

    const suggestedPlanB = updatedPlan.planBAlternatives[0];
    const recoveryNotice = `Partial Confirmation: Batch 1 (${updatedPlan.batches[0]?.passengers.length} pax) Confirmed on PNR ${updatedPlan.batches[0]?.pnrMock}. Batch 2 was placed on Waitlist WL#2 due to Tatkal window surge.`;

    return {
      updatedPlan,
      recoveryNotice,
      suggestedPlanB,
    };
  }
}

