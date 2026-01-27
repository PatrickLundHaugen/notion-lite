export const MAC_SYMBOLS: Record<string, string> = {
  mod: "⌘",
  command: "⌘",
  meta: "⌘",
  ctrl: "⌃",
  control: "⌃",
  alt: "⌥",
  option: "⌥",
  shift: "⇧",
  backspace: "Del",
  delete: "⌦",
  enter: "⏎",
  escape: "⎋",
  capslock: "⇪",
} as const;

export function isMac(): boolean {
  return (
    typeof navigator !== "undefined" &&
    navigator.platform.toLowerCase().includes("mac")
  );
}

export function formatShortcutKey(
  key: string,
  isMacPlatform: boolean,
  capitalize = true
) {
  if (isMacPlatform) {
    const lowerKey = key.toLowerCase();
    return MAC_SYMBOLS[lowerKey] || (capitalize ? key.toUpperCase() : key);
  }
  return capitalize ? key.charAt(0).toUpperCase() + key.slice(1) : key;
}

export function parseShortcutKeys({
  shortcutKeys,
  delimiter = "+",
  capitalize = true,
}: {
  shortcutKeys: string | undefined;
  delimiter?: string;
  capitalize?: boolean;
}) {
  if (!shortcutKeys) return [];
  return shortcutKeys
    .split(delimiter)
    .map((key) => key.trim())
    .map((key) => formatShortcutKey(key, isMac(), capitalize));
}
