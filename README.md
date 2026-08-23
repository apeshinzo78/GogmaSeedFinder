# Gogma Seed Finder

Monster Hunter Wildsのゴグマ／アーティア抽選結果からRNG状態を絞り込み、将来の結果を予測するための独立プロジェクトです。

主な対象は、ゲーム内部の値を直接取得できないPS5ユーザーです。観測結果を手入力し、利用者のブラウザ内で候補探索と未来予測を行うWebツールを目指します。

## Status

ゴグマのシリーズ／グループスキル抽選と、巨戟復元強化の「ボーナスをリセットして再復元」「ボーナスを同じ構成で再復元」について、Rust版`rng-core`とgolden testを実装済みです。巨戟復元は既知counterとcounter範囲探索に対応し、ブラウザ内のRust/WASMとWeb Workerで探索できます。スラッシュアックス、弓、ヘビィボウガンの実測に合わせた武器種別の候補プールを実装し、ライトボウガンはヘビィと同じルールを使用します。スラッシュアックスで未来予測が再現すること、抽選結果は武器種・属性で変わり、武器個体が違っても両方が一致すれば同じになることをゲーム内で確認済みです。

Web画面はセーブ地点を相対位置`0`として扱い、発見した候補から最大1,000回の未来を計算します。5つの用途別タブ、現在の基準seedと2カウンター、端末内保存、最大16件の武器プロファイル比較に対応しています。リセット結果の「この構成でEX厳選へ」から保存後カウンターと5枠構成を引き継げます。また、複数のEX未厳選武器へ個別の5枠構成を登録し、同じ共通カウンターから横並びで比較できます。スキル位置の特定後は、共通seed・復元位置・スキル位置を保持する`GSF2`を両方の未来表に表示します。EXボーナスは攻撃・会心・属性・斬れ味／装填の系統色を保ったまま強調します。スキル未来予測と同じ構成での再復元はGARP v0.9.3の式との一致までで、独立したゲーム実測による確認はまだです。通常アーティア強化、スクリーンショット入力、非常に広い未知counter探索は未実装です。

## Planned architecture

- `crates/rng-core`: Luaで確認した32-bit RNGと各抽選のRust実装
- `crates/seed-search-cli`: 観測結果から候補を探索する検証用CLI
- `docs`: RNG仕様と検証記録
- `research/upstream`: 上流資料の出典・ハッシュ・取扱記録
- `diagnostics/gogma-constraint-probe`: ゲーム内のボーナス制約値をJSON出力する読み取り専用REFramework診断
- `tests/fixtures`: Lua実装と比較する既知の入出力
- `web`: Rust/WASMを使用するWeb UI（探索PoC成立後に追加）

## Development order

1. ゴグマのセット／グループスキル抽選をRustへ移植する（完了）
2. Lua版と連続結果が一致するgolden testを作る（完了）
3. 既知seedを再発見するCLIを作る（既知counterについて完了）
4. 必要な観測数と探索時間を測定する（golden sampleについて完了）
5. 巨戟復元強化のReset Bonusesを移植し、実測golden testを作る（完了）
6. ゴグマボーナス観測からの既知counter探索を追加する（完了）
7. 有界の未知Gogma counter探索を追加する（完了）
8. WebAssemblyとWeb Worker版の速度検証UIを追加する（完了）
9. ゲーム画面の名称で入力できる手動入力UIへ拡張する（完了）
10. 発見したseed/counterから未来の結果を表示する（完了）
11. 途中セーブ用のセーブ状態コードとEX強調を追加する（完了）
12. 既知seed上のスキル位置探索と未来予測UIを追加する（golden vectorについて完了、実測待ち）
13. 複数の武器種・属性の比較表と、両抽選位置を保持する`GSF2`を追加する（完了）
14. 用途別5タブ、共通セーブ状態、武器プロファイルごとのKeep Bonuses未来予測を追加する（GARP式について完了、実測待ち）

## Verification

```powershell
cargo test --workspace --all-targets
cargo clippy --workspace --all-targets -- -D warnings
```

## Web prototype

公開版: [Gogma Seed Finder](https://apeshinzo78.github.io/GogmaSeedFinder/)

すべての探索・未来予測は利用者のブラウザ内で実行され、観測結果やseedがサーバーへ送信されることはありません。

```powershell
.\scripts\build-wasm.ps1
python -m http.server 4173 --bind 127.0.0.1 --directory web
```

ブラウザで`http://127.0.0.1:4173/`を開きます。詳細は`docs/WEB_POC.md`を参照してください。

## Attribution

アルゴリズム調査はWiseHorror氏の「Gogma Artian Roll Planner」を参照しています。詳細は`THIRD_PARTY_NOTICES.md`を参照してください。

## License

このリポジトリ自身のライセンスは未選定です。明示された第三者の権利・許諾を除き、ライセンスが追加されるまで再利用の許諾は付与されません。
