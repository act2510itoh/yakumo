const header = document.querySelector('.l-header');

// worksの画像を固定する位置に使うため、ヘッダーの高さをCSS変数に入れる
const setHeaderHeight = () => {
	const height = header.offsetHeight;
	document.documentElement.style.setProperty('--header-height', `${height}px`);
};

setHeaderHeight();
window.addEventListener('resize', setHeaderHeight);
window.addEventListener('load', setHeaderHeight);

/*=================================================
  メインビジュアル:動画を流し終えたら画像の切り替えへ
===================================================*/
const mainvisual = document.querySelector('.p-top-mainvisual');
const mainvisualMovie = document.querySelector('.p-top-mainvisual__movie');

// 動画を消して、止めていた画像の切り替えを始める
const endMainvisualMovie = () => {
	mainvisual.classList.add('is-movie-end');
};

if (mainvisualMovie) {
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	// 同じ訪問中にすでに流したか(<head>で判定して付けた印)
	const alreadyPlayed = document.documentElement.classList.contains('is-movie-played');

	if (reduceMotion || alreadyPlayed) {
		// 動きを減らす設定の人と、2回目以降は動画を流さない
		mainvisualMovie.pause();
		endMainvisualMovie();
	} else {
		// 再生が始まったら「この訪問では流した」と記録する(タブを閉じると消える)
		mainvisualMovie.addEventListener(
			'play',
			() => {
				try {
					sessionStorage.setItem('mvMoviePlayed', '1');
				} catch (e) {}
			},
			{ once: true },
		);
		mainvisualMovie.addEventListener('ended', endMainvisualMovie);
		mainvisualMovie.addEventListener('error', endMainvisualMovie, true); // 動画が読み込めなかった時
		// 自動再生がブラウザに止められた時(省電力モードなど)
		mainvisualMovie.play().catch(endMainvisualMovie);
	}
}

gsap.registerPlugin(ScrollTrigger);

const textItems = gsap.utils.toArray('.p-top-works__text-item');
const imageItems = gsap.utils.toArray('.p-top-works__image-item');

// inset()はブラウザが省略形に変換してGSAPの補間がずれるため、polygon()で指定
const OPEN = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
const HIDDEN_LEFT = 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)'; // 左端に畳んだ状態

let currentIndex = 0;
let baseIndex = 0; // 全面表示が完了している画像(SPで背景色を見せないための下敷き)
let worksTimeline;

const spQuery = window.matchMedia('(max-width: 849px)');

// SP:背景色を見せずに、下敷きの画像の上へ次の画像を左からスライドインして重ねる
const showWorksImageSp = (nextIndex) => {
	const nextImage = imageItems[nextIndex];
	const otherImages = imageItems.filter((img) => img !== nextImage);

	// 下敷きの画像へ戻る時は、上に重なっている画像を左へ畳んで見せる
	if (nextIndex === baseIndex) {
		worksTimeline = gsap.to(otherImages, {
			clipPath: HIDDEN_LEFT,
			x: -100,
			duration: 1,
			ease: 'power3.inOut',
		});
		return;
	}

	gsap.set(otherImages, { zIndex: 0 });
	gsap.set(nextImage, { zIndex: 1 });

	worksTimeline = gsap.fromTo(
		nextImage,
		{ clipPath: HIDDEN_LEFT, x: -100 },
		{
			clipPath: OPEN,
			x: 0,
			duration: 1.5,
			ease: 'power3.out',
			// 覆い終わってから下の画像を畳み、次の下敷きにする
			onComplete: () => {
				gsap.set(otherImages, { clipPath: HIDDEN_LEFT, x: -100 });
				baseIndex = nextIndex;
			},
		},
	);
};

// PC:表示中の画像を左へ畳む → 背景色を一瞬見せる → 次の画像を左からスライドイン
const showWorksImagePc = (nextIndex) => {
	const nextImage = imageItems[nextIndex];

	// 閉じる画像と重なっても次の画像が上に来るように
	gsap.set(imageItems, { zIndex: 0 });
	gsap.set(nextImage, { zIndex: 1 });

	worksTimeline = gsap
		.timeline({ onComplete: () => (baseIndex = nextIndex) })
		.to(imageItems, {
			clipPath: HIDDEN_LEFT,
			x: -100,
			duration: 1,
			ease: 'power3.inOut',
		})
		.fromTo(
			nextImage,
			{ clipPath: HIDDEN_LEFT, x: -100 },
			{
				clipPath: OPEN,
				x: 0,
				duration: 1.5,
				ease: 'power3.out',
				immediateRender: false, // 閉じる動きが進むまで開始値を適用しない
			},
			'-=0.3', // 背景色を見せる長さ(約0.1秒)(マイナスを大きくすると短く、'+=0.2'などで長く)
		);
};

const showWorksImage = (nextIndex) => {
	if (nextIndex === currentIndex) return;
	currentIndex = nextIndex;

	worksTimeline?.kill(); // 素早くスクロールした時は途中から切り替える

	if (spQuery.matches) {
		showWorksImageSp(nextIndex);
	} else {
		showWorksImagePc(nextIndex);
	}
};

// 画面幅ごとに設定を切り替える(幅が変わると自動で作り直される)
const mm = gsap.matchMedia();

// SP:画像が背景なので、前の文章が上へ抜け、次の文章が下から入ってくる頃に切り替え
mm.add('(max-width: 849px)', () => {
	textItems.forEach((text, index) => {
		ScrollTrigger.create({
			trigger: text,
			start: 'top 50%',
			end: 'bottom 50%',
			onEnter: () => showWorksImage(index),
			onEnterBack: () => showWorksImage(index),
		});
	});
});

// PC
mm.add('(min-width: 850px)', () => {
	textItems.forEach((text, index) => {
		ScrollTrigger.create({
			trigger: text,
			start: 'top 40%', // テキストの上端が画面の上から40%に来たら切り替え
			end: 'bottom 40%',
			onEnter: () => showWorksImage(index),
			onEnterBack: () => showWorksImage(index),
		});

		// 文字をスクロールより少し遅く動かし、ゆっくり流れて見えるように
		gsap.fromTo(
			text.children,
			{ y: -200 },
			{
				y: 200,
				ease: 'none',
				scrollTrigger: {
					trigger: text,
					start: 'top bottom',
					end: 'bottom top',
					scrub: true, // スクロール量に合わせて動かす
				},
			},
		);
	});
});
