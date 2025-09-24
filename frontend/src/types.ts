// This file contains shared TypeScript types used across the frontend application.
// It acts as a single source of truth for the shape of data, like the API contract.

export type Page = {
    // Represents the structure of a single page object received from the backend API.
    id: number;
    title: string;
    content: string;
    // Note: owner_id is also sent by the backend, but we don't currently use it
    // on the frontend. We can add it here if needed in the future.
};