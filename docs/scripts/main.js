(() => {
	const getDocsRoot = () => document.body?.dataset.docsRoot ?? './';

	const resolveDocHref = (target) => {
		const root = new URL(getDocsRoot(), document.baseURI);
		return new URL(target, root).href;
	};

	const wireDocLinks = () => {
		document.querySelectorAll('[data-doc-href]').forEach((link) => {
			const target = link.getAttribute('data-doc-href');
			if (!target) {
				return;
			}

			link.setAttribute('href', resolveDocHref(target));
		});

		const activePage = document.body?.dataset.page;
		if (activePage) {
			document.querySelectorAll('[data-nav-link]').forEach((link) => {
				if (link.getAttribute('data-nav-link') === activePage) {
					link.classList.add('is-active');
				}
			});
		}
	};

	const loadIncludes = async () => {
		const placeholders = Array.from(document.querySelectorAll('[data-include]'));
		await Promise.all(
			placeholders.map(async (placeholder) => {
				const includePath = placeholder.getAttribute('data-include');
				if (!includePath) {
					return;
				}

				try {
					const response = await fetch(includePath, { cache: 'no-cache' });
					if (!response.ok) {
						return;
					}

					placeholder.innerHTML = await response.text();
				} catch {
					return;
				}
			}),
		);
	};

	const syncFooterYear = () => {
		document.querySelectorAll('[data-current-year]').forEach((node) => {
			node.textContent = String(new Date().getFullYear());
		});
	};

	const boot = async () => {
		await loadIncludes();
		wireDocLinks();
		syncFooterYear();

		window.OpenStoreDocsContext = {
			page: document.body?.dataset.page ?? 'home',
			root: getDocsRoot(),
			resolveHref: resolveDocHref,
		};

		window.OpenStoreDocsSearch?.init?.({ resolveHref: resolveDocHref });
		window.OpenStoreImageZoom?.init?.();
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			void boot();
		});
	} else {
		void boot();
	}
})();
