// Simple confetti effect
export function fireConfetti() {

    // Since implementing a full confetti engine from scratch is verbose, 
    // I will use a simple "Emoji Burst" effect that creates floating emojis.

    const emojis = ["🎉", "✨", "✅", "🔥", "🎊"];
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.inset = "0";
    container.style.pointerEvents = "none";
    container.style.zIndex = "9999";
    document.body.appendChild(container);

    for (let i = 0; i < 30; i++) {
        const el = document.createElement("div");
        el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.position = "absolute";
        el.style.left = "50%";
        el.style.top = "50%";
        el.style.fontSize = Math.random() * 20 + 20 + "px";
        el.style.transform = `translate(-50%, -50%)`;
        el.style.transition = "all 1s ease-out";
        el.style.opacity = "1";

        container.appendChild(el);

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 200 + 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        requestAnimationFrame(() => {
            el.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${Math.random() * 360}deg)`;
            el.style.opacity = "0";
        });
    }

    setTimeout(() => {
        document.body.removeChild(container);
    }, 1000);
}
