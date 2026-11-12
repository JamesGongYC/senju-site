// On the stage, the blue cursor is you. With a mouse over it, it follows your pointer
// while the agents carry on, which is the whole idea of the app.
const stage = document.getElementById('stage');
const you = document.getElementById('you');
if (stage && you && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  stage.addEventListener('pointerenter', () => stage.classList.add('live'));
  stage.addEventListener('pointermove', (e) => {
    const box = stage.getBoundingClientRect();
    you.style.transform = `translate(${e.clientX - box.left}px, ${e.clientY - box.top}px)`;
  });
  stage.addEventListener('pointerleave', () => { stage.classList.remove('live'); you.style.transform = ''; });
} else if (stage) {
  stage.style.cursor = 'auto';
}
