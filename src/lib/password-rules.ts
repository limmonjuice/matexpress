// What makes a password too easy to guess, beyond its length. No character-mix rules: "Password1!" passes
// those and is one of the first guesses anyone tries, while three unrelated words fail them and are strong.

const TOO_EASY = "That password is too easy to guess. Try three or four unrelated words.";
const TOO_PERSONAL = "Leave your name and email out of your password.";

/** Checked with any numbers and symbols around them taken off, so "Password123!" counts as "password". */
const COMMON = new Set(
  `password passwort pass passcode passkey secret letmein welcome admin administrator root login user guest test tester testing
  default changeme master access trustno iloveyou iloveu loveyou lovely love sunshine princess prince football baseball basketball
  soccer dragon monkey shadow superman batman spiderman pokemon starwars whatever freedom flower hello helloworld computer internet
  samsung google facebook michael jennifer jordan michelle charlie daniel andrew thomas ashley jessica nicole justin hunter ranger
  harley mustang ferrari abc abcd abcde abcdef abcdefg abcdefgh asdf asdfg asdfgh asdfghjkl zxcv zxcvb zxcvbn zxcvbnm qwert qwerty
  qwertyuiop qazwsx qazwsxedc zaq zaqwsx xsw mahalkita mahal mahalko pilipinas philippines pinoy pinay manila maynila quezon jesus
  jesuschrist godisgood matexpress construction contractor hardware semento cement 1q2w3e4r 1q2w3e4r5t 1qaz2wsx a1b2c3d4 aa123456`
    .split(/\s+/)
    .filter(Boolean),
);

/** Runs of neighbouring keys or letters. A password that's any stretch of one of these, either way round, is out. */
const RUNS = ["01234567890123456789", "abcdefghijklmnopqrstuvwxyz", "qwertyuiop", "asdfghjkl", "zxcvbnm"].flatMap((run) => [run, [...run].reverse().join("")]);

const LOOKALIKES: Record<string, string> = { "@": "a", "4": "a", "3": "e", "1": "i", "!": "i", "0": "o", "$": "s", "5": "s", "7": "t" };

const undisguise = (text: string) => [...text].map((character) => (Object.hasOwn(LOOKALIKES, character) ? LOOKALIKES[character] : character)).join("");

/** The word underneath: what's left with the numbers and symbols around it gone, and "@" read as "a". */
const coreWord = (text: string) => undisguise(text.replace(/^[^a-z@$]+/, "").replace(/[^a-z]+$/, ""));

/** The parts of a name or email long enough to mean something: "rosa" from "rosa.santos@example.com", never "the". */
const personalWords = (about: unknown[]) =>
  about.flatMap((value) =>
    typeof value === "string"
      ? value
          .toLowerCase()
          .split("@")[0]
          .split(/[^a-z0-9]+/)
          .filter((word) => word.length >= 4)
      : [],
  );

/** Why a password won't do, in words for the person choosing it. Undefined if it's fine. */
export function passwordProblem(password: unknown, about: unknown[] = []): string | undefined {
  // Whether it's text at all, and its length, are for the auth library's own checks to answer.
  if (typeof password !== "string") return undefined;
  const lower = password.toLowerCase();

  if (personalWords(about).some((word) => lower.includes(word) || undisguise(lower).includes(word))) return TOO_PERSONAL;

  const obvious =
    (/^\d+$/.test(lower) && lower.length < 12) || // Mobile numbers and birthdays, mostly.
    /^(.{1,4})\1+$/.test(lower) || // "aaaaaaaa", "abcabcabc", "12341234".
    RUNS.some((run) => run.includes(lower)) ||
    COMMON.has(lower) ||
    COMMON.has(undisguise(lower)) ||
    COMMON.has(coreWord(lower));

  return obvious ? TOO_EASY : undefined;
}
