/** Heuristics for "the application was just submitted". ("Thank you for your interest" is
 *  deliberately excluded — it often appears on ordinary posting pages.) Job sites change their markup, so
 *  these combine URL shapes with confirmation wording and should be re-checked periodically. */
const SUCCESS_TEXT =
  /(thank you for (applying|your application)|thanks for applying|application (has been |was )?(successfully )?(submitted|received|sent)|you('| ha)ve (successfully )?applied|we('| ha)ve received your application|your application is complete)/i

const SUCCESS_URL = [
  /lever\.co\/.+\/thanks\/?$/i, // Lever: /company/id/thanks
  /greenhouse\.io\/.+\/confirmation/i, // Greenhouse confirmation page
  /\/(application[-_]?)?(confirmation|submitted|thank[-_]?you)\/?$/i,
]

export function looksSubmitted(url: string, visibleText: string): boolean {
  return SUCCESS_URL.some((pattern) => pattern.test(url)) || SUCCESS_TEXT.test(visibleText)
}
