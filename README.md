# 助けろ艦長！腹痛のfpandaさんを救え！

GitHub Pages に対応した、艦長の腕を操作して腹痛のfpandaさんを助ける無料ブラウザゲームです。

## 操作

- スマホ・タブレット：画面下のスティックをドラッグして艦長の手を動かす
- PC：スティックをマウスドラッグ、または WASD / 矢印キー
- ゲームパッド：左スティックまたは方向キー
- 停止ボタン、Esc または Space：一時停止

おなかの上で艦長の手を動かし続けると腹痛が軽減。60 秒以内に腹痛 0％にできれば勝利です。停止していると腹痛が徐々に強くなります。スコアとベスト記録はブラウザに保存されます。腹痛の位置を示すガイドはありません。

## 素材
- `assets/captain-no-hand.webp`：手を除去した背景写真
- `assets/captain-arm.webp`：艦長の制服を着た長い腕（透過 WebP）

元の画像から制作した素材を別レイヤーで配置し、腕だけを動かしています。素材を差し替える際は縦横比・手の位置に注意してください。

## GitHub Pages 公開

このフォルダのファイルをリポジトリ直下に置き、Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)` を選択します。

公開 URL： https://ryg4mk.github.io/captain-belly-rescue/

外部 CDN / サーバー / ビルド環境は不要です。HTML・CSS・JavaScript だけで動作します。