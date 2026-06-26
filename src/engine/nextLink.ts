import { injectStylesOnce } from "./styles";

/**
 * renders a small "Next" link (or `label`, if given) into `container`;
 * resolves once the visitor clicks it, then removes the link. Used to gate a
 * step transition behind a deliberate action instead of a guessed timer.
 */
export function showNextLink(container: HTMLElement, label = "Next"): Promise<void> {
  injectStylesOnce();
  return new Promise((resolve) => {
    const link = document.createElement("a");
    link.href = "#";
    link.classList.add("wd-next-link");
    link.textContent = label;
    link.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        link.remove();
        resolve();
      },
      { once: true },
    );
    container.appendChild(link);
  });
}
