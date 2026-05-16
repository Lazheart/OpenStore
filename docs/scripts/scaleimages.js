(() => {
	let modal;

	const ensureModal = () => {
		if (modal) {
			return modal;
		}

		modal = document.createElement('div');
		modal.className = 'image-modal';
		modal.innerHTML = `
			<div class="image-modal__backdrop" data-modal-close></div>
			<div class="image-modal__panel" role="dialog" aria-modal="true" aria-label="Vista ampliada">
				<button class="image-modal__close" type="button" data-modal-close aria-label="Cerrar">×</button>
				<img alt="Vista ampliada" data-modal-image />
			</div>
		`;
		document.body.appendChild(modal);
		modal.addEventListener('click', (event) => {
			if (event.target instanceof HTMLElement && event.target.hasAttribute('data-modal-close')) {
				closeModal();
			}
		});
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				closeModal();
			}
		});
		return modal;
	};

	const openModal = (image) => {
		const instance = ensureModal();
		const modalImage = instance.querySelector('[data-modal-image]');
		if (!(modalImage instanceof HTMLImageElement)) {
			return;
		}

		modalImage.src = image.currentSrc || image.src;
		modalImage.alt = image.alt || 'Imagen ampliada';
		instance.classList.add('is-open');
		document.body.style.overflow = 'hidden';
	};

	const closeModal = () => {
		if (!modal) {
			return;
		}

		modal.classList.remove('is-open');
		document.body.style.overflow = '';
	};

	const init = () => {
		document.querySelectorAll('[data-zoomable], .zoomable-image').forEach((element) => {
			if (!(element instanceof HTMLImageElement)) {
				return;
			}

			element.addEventListener('click', () => openModal(element));
		});
	};

	window.OpenStoreImageZoom = { init };
})();
