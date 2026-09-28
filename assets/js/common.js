/*=================================================
  セクションタイトルの線を引く演出
===================================================*/
const sectionTitles = document.querySelectorAll('.c-section-title');

const titleObserver = new IntersectionObserver(
	(entries) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) return;
			entry.target.classList.add('is-show');
			titleObserver.unobserve(entry.target); // 一度引いたら終わり
		});
	},
	{ rootMargin: '0px 0px -10% 0px' }, // 画面の下から10%の位置まで来たら
);

sectionTitles.forEach((title) => titleObserver.observe(title));

$(function () {
	/*=================================================
  ハンバーガ―メニュー
  ===================================================*/
	const $header = $('.l-header');
	const $ham = $('.l-ham');

	// メニューの開閉と、読み上げソフト向けの状態(開いているか・ボタンの名前)をそろえて切り替える
	const setMenuOpen = (isOpen) => {
		$header.toggleClass('open', isOpen);
		$ham.attr({
			'aria-expanded': isOpen,
			'aria-label': isOpen ? 'メニューを閉じる' : 'メニューを開く',
		});
	};

	// ハンバーガーメニューをクリックした時
	$ham.on('click', function () {
		setMenuOpen(!$header.hasClass('open'));
	});
	// メニューのリンクをクリックした時
	$('.l-nav a').on('click', function () {
		setMenuOpen(false);
	});
	// Escキーでメニューを閉じる
	$(document).on('keydown', function (e) {
		if (e.key === 'Escape' && $header.hasClass('open')) {
			setMenuOpen(false);
			$ham.trigger('focus');
		}
	});
});
