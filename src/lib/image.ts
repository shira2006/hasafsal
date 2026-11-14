/** מקטין תמונה ל-1280px ו-JPEG כדי לחסוך נתונים ואחסון. */
export function shrinkImage(file: File, max = 1280): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("תמונה לא תקינה"))), "image/jpeg", 0.82);
    };
    img.onerror = () => reject(new Error("לא ניתן לקרוא את התמונה"));
    img.src = URL.createObjectURL(file);
  });
}
