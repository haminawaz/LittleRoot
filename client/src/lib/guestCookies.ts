const COOKIE_OPTIONS = {
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: false,
  sameSite: "lax" as const,
};

export function getGuestBooksCreated(): number {
  if (typeof document === "undefined") return 0;

  const cookies = document.cookie.split(";");
  const cookie = cookies.find((c) => c.trim().startsWith("guestBooksCreated="));

  if (!cookie) return 0;

  const value = cookie.split("=")[1];
  return parseInt(value, 10) || 0;
}

export function setGuestBooksCreated(count: number): void {
  if (typeof document === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + COOKIE_OPTIONS.maxAge);

  document.cookie = `guestBooksCreated=${count}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function getGuestPagesForBook(storyId: string): number {
  if (typeof document === "undefined") return 0;

  const cookies = document.cookie.split(";");
  const cookie = cookies.find((c) =>
    c.trim().startsWith(`guestPages_${storyId}=`)
  );

  if (!cookie) return 0;

  const value = cookie.split("=")[1];
  return parseInt(value, 10) || 0;
}

export function setGuestPagesForBook(storyId: string, count: number): void {
  if (typeof document === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + COOKIE_OPTIONS.maxAge);

  document.cookie = `guestPages_${storyId}=${count}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function clearGuestData(): void {
  if (typeof document === "undefined") return;

  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const cookieName = cookie.split("=")[0].trim();

    if (cookieName.startsWith("guest")) {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }
}

export function canGuestCreateBook(): { allowed: boolean; message?: string } {
  const booksCreated = getGuestBooksCreated();

  if (booksCreated >= 2) {
    return {
      allowed: false,
      message:
        "You've reached the guest limit of 2 books. Sign up to create unlimited books!",
    };
  }

  return { allowed: true };
}

export function canGuestCreatePages(
  storyId: string,
  requestedPages: number
): { allowed: boolean; message?: string } {
  const currentPages = getGuestPagesForBook(storyId);

  if (requestedPages > 12) {
    return {
      allowed: false,
      message:
        "Guest users can create up to 12 pages per book. Sign up for more pages!",
    };
  }

  if (currentPages + requestedPages > 12) {
    return {
      allowed: false,
      message: `You can only add ${
        12 - currentPages
      } more pages to this book. Sign up for unlimited pages!`,
    };
  }

  return { allowed: true };
}
