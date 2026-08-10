/**
 * Блокування прокрутки сторінки під модалками.
 *
 * Лічильник, а не запам'ятовування попереднього значення в кожній шторці:
 * якщо дві шторки відкриті одночасно, друга запам'ятала б уже "hidden"
 * і при закритті повернула б його назад — сторінка залишилась би без скролу.
 */

let locks = 0;
let savedOverflow = "";
let savedScrollY = 0;

export function lockScroll() {
  if (typeof document === "undefined") return;
  if (locks === 0) {
    savedOverflow = document.body.style.overflow;
    savedScrollY = window.scrollY;
    document.body.style.overflow = "hidden";
  }
  locks++;
}

export function unlockScroll() {
  if (typeof document === "undefined") return;
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    document.body.style.overflow = savedOverflow;
    // Safari подекуди скидає позицію при знятті overflow — повертаємо її.
    window.scrollTo(0, savedScrollY);
  }
}
