# Testing evidence (table + how to screenshot)

## Automated tests (Vitest)

Run:

- `npm test`

Take a screenshot of:

- Terminal output showing **all tests passed**

### Automated test cases

|  ID | Component/Module | Input type | Steps                                       | Expected result                 | Evidence                |
| --: | ---------------- | ---------- | ------------------------------------------- | ------------------------------- | ----------------------- |
|  A1 | `TagInput`       | Normal     | Type `AI`, press Enter                      | `onChange` called with `['AI']` | tests/TagInput.test.tsx |
|  A2 | `TagInput`       | Erroneous  | Type whitespace, press Enter                | No tag added                    | tests/TagInput.test.tsx |
|  A3 | `TagInput`       | Extreme    | Try to add duplicate `AI`                   | No duplicate added              | tests/TagInput.test.tsx |
|  A4 | `TagInput`       | Normal     | Backspace with empty input and tags present | Last tag removed                | tests/TagInput.test.tsx |
|  A5 | `cn()`           | Normal     | Merge classnames                            | Returns merged class string     | tests/utils.test.ts     |
|  A6 | `cn()`           | Extreme    | Tailwind conflict `p-2` + `p-4`             | Keeps `p-4`                     | tests/utils.test.ts     |

## Manual UI testing (normal + erroneous + extreme)

Take screenshots of the **page result** for each case (browser window + the visible error/success message).

|  ID | Page      | Input type | Steps                                                  | Expected result                        | Screenshot       |
| --: | --------- | ---------- | ------------------------------------------------------ | -------------------------------------- | ---------------- |
|  M1 | /register | Normal     | Fill all required fields validly; submit               | Account created; redirect to dashboard | (add screenshot) |
|  M2 | /register | Erroneous  | Leave required fields empty; submit                    | Validation error shown; no submit      | (add screenshot) |
|  M3 | /register | Extreme    | Very long strings (e.g., 300 chars) in optional fields | UI remains usable; no crash            | (add screenshot) |
|  M4 | /projects | Normal     | Create project with multiple tags                      | Project appears; tags shown            | (add screenshot) |
|  M5 | /projects | Erroneous  | Try to post project with empty title/description       | Error toast shown                      | (add screenshot) |
|  M6 | /research | Normal     | Filter by a tag pill                                   | List updates to matching items         | (add screenshot) |

Notes:

- If a flow depends on real Supabase data, use a test account and record the exact input you used next to the screenshot.
