# 艦長！おなかをたすけて！ / Captain's Belly Rescue

白ひげの艦長が腹痛を助ける、指でなでる60秒間のブラウザゲームです。提供されたオリジナル画像を使用しています。

## 遊び方
1. 「救助をはじめる」を押します。
2. おなかに現れる赤いモヤの上を、指（PCならマウス）で押したまま、ゆっくり動かします。止めたままでは回復しません。
3. 痛みを 0 にしたら成功。60秒を超えるか痛みが100%になると失敗です。
4. 速すぎる動きは痛みを増やします。スコアとベスト記録はブラウザのローカル保存です。

## GitHub Pages公開
GitHubで**公開（Public）リポジトリ**を新規作成し、このフォルダのファイルを**フォルダの中身ごとリポジトリ直下**へアップロードしてください。
`index.html`, `style.css`, `game.js`, `favicon.svg`, `assets/captain.jpg` が同じ相対構成になるようにします。

Repository **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main, Folder: /(root) → Save**。
数分後に `https://<GitHubユーザー名>.github.io/<リポジトリ名>/` で遊べます。

すでにPages公開中の `ryg4mk.github.io` リポジトリに `captain-belly-rescue/` フォルダとして配置した場合は、`https://ryg4mk.github.io/captain-belly-rescue/` です。独立リポジトリにするときはリポジトリ名を `captain-belly-rescue` にするのがおすすめです。

## 技術・権利
- HTML / CSS / Vanilla JavaScript、フレームワーク不要、外部API不要
- 画像は `assets/captain.jpg`。添付画像を使用
- オフライン動作可能（外部フォント・ライブラリ不使用）
- タッチ、マウス、サウンドON/OFF、Pause、ベストスコア保存に対応
- サーバーや課金機能不要、静的ページとして配信可能
