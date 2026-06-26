/**
 * Bed Management Service
 * Centralizes all bed-related API calls for easy maintenance, testing, and auth header management.
 */

import { Bed } from "@/lib/mock-data";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

// Simulate API delay for demo purposes
const API_DELAY = 300;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface AllocateBedPayload {
  bedId: string;
  patientName: string;
  patientType: string;
}

interface ReleaseBedPayload {
  bedId: string;
}

interface TransferBedPayload {
  bedId: string;
  targetWard: string;
}

interface ExportReportPayload {
  format: "csv" | "pdf";
  dateRange?: { startDate: string; endDate: string };
}

/**
 * Fetch all available beds from the backend
 * @throws Error if API call fails
 */
export const fetchBeds = async (): Promise<Bed[]> => {
  try {
    // In production, replace with actual API call:
    // const response = await fetch(`${BASE_URL}/beds`);
    // if (!response.ok) throw new Error('Failed to fetch beds');
    // return response.json();

    await delay(API_DELAY);
    return Promise.resolve([]);
  } catch (error) {
    console.error("Error fetching beds:", error);
    throw new Error("Failed to fetch beds. Please try again.");
  }
};

/**
 * Allocate a bed to a patient
 * @param payload - Allocation request payload
 * @throws Error if API call fails or validation fails
 */
export const allocateBed = async (
  payload: AllocateBedPayload,
): Promise<{
  success: boolean;
  bedId: string;
  patientName: string;
  message?: string;
}> => {
  try {
    if (!payload.bedId || !payload.patientName) {
      throw new Error("Bed ID and patient name are required");
    }

    // In production:
    // const response = await fetch(`${BASE_URL}/beds/allocate`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${authToken}`
    //   },
    //   body: JSON.stringify(payload)
    // });
    // if (!response.ok) throw new Error(await response.text());
    // return response.json();

    await delay(API_DELAY);
    return {
      success: true,
      bedId: payload.bedId,
      patientName: payload.patientName,
      message: `Patient ${payload.patientName} successfully allocated to bed ${payload.bedId}`,
    };
  } catch (error) {
    console.error("Error allocating bed:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to allocate bed. Please try again.",
    );
  }
};

/**
 * Release/discharge a patient from a bed
 * @param payload - Release request payload
 * @throws Error if API call fails
 */
export const releaseBed = async (
  payload: ReleaseBedPayload,
): Promise<{
  success: boolean;
  bedId: string;
  message?: string;
}> => {
  try {
    if (!payload.bedId) {
      throw new Error("Bed ID is required");
    }

    // In production:
    // const response = await fetch(`${BASE_URL}/beds/${payload.bedId}/release`, {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${authToken}`
    //   }
    // });
    // if (!response.ok) throw new Error(await response.text());
    // return response.json();

    await delay(API_DELAY);
    return {
      success: true,
      bedId: payload.bedId,
      message: `Bed ${payload.bedId} has been released and is now available`,
    };
  } catch (error) {
    console.error("Error releasing bed:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to release bed. Please try again.",
    );
  }
};

/**
 * Transfer a patient to another bed
 * @param payload - Transfer request payload
 * @throws Error if API call fails
 */
export const transferBed = async (
  payload: TransferBedPayload,
): Promise<{
  success: boolean;
  bedId: string;
  targetWard: string;
  message?: string;
}> => {
  try {
    if (!payload.bedId || !payload.targetWard) {
      throw new Error("Bed ID and target ward are required");
    }

    // In production: implement actual API call

    await delay(API_DELAY);
    return {
      success: true,
      bedId: payload.bedId,
      targetWard: payload.targetWard,
      message: `Transfer initiated for bed ${payload.bedId} to ${payload.targetWard}`,
    };
  } catch (error) {
    console.error("Error transferring bed:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to transfer bed. Please try again.",
    );
  }
};

/**
 * Mark a bed for cleaning
 * @param bedId - ID of the bed to mark for cleaning
 * @throws Error if API call fails
 */
export const markBedForCleaning = async (
  bedId: string,
): Promise<{
  success: boolean;
  bedId: string;
  message?: string;
}> => {
  try {
    if (!bedId) {
      throw new Error("Bed ID is required");
    }

    // In production: implement actual API call

    await delay(API_DELAY);
    return {
      success: true,
      bedId: bedId,
      message: `Bed ${bedId} marked for cleaning`,
    };
  } catch (error) {
    console.error("Error marking bed for cleaning:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to mark bed for cleaning.");
  }
};

/**
 * Export report (CSV or PDF)
 * @param payload - Export request payload
 * @throws Error if API call fails
 */
export const exportReport = async (payload: ExportReportPayload): Promise<Blob> => {
  try {
    // In production:
    // const response = await fetch(`${BASE_URL}/reports/export`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${authToken}`
    //   },
    //   body: JSON.stringify(payload)
    // });
    // if (!response.ok) throw new Error('Failed to export report');
    // return response.blob();

    await delay(API_DELAY);
    const content =
      payload.format === "csv"
        ? "Date,Type,Severity,Resolution\n18 May,Bed allocation > 30m,High,Resolved in 12m"
        : "HOSPITAL BED CONNECT REPORT";

    return new Blob([content], {
      type: payload.format === "csv" ? "text/csv" : "application/pdf",
    });
  } catch (error) {
    console.error("Error exporting report:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to export report. Please try again.",
    );
  }
};
