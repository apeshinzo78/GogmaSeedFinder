# Gogma Seed Finder

Monster Hunter Wildsのゴグマ／アーティア抽選結果からRNG状態を絞り込み、将来の結果を予測するための独立プロジェクトです。

主な対象は、ゲーム内部の値を直接取得できないPS5ユーザーです。観測結果を手入力し、利用者のブラウザ内で候補探索と未来予測を行うWebツールを目指します。

## Status

ゴグマのセット／グループスキル抽選について、Rust版`rng-core`と上流v0.9.3由来のgolden testを実装済みです。seed探索、通常アーティア強化、ゴグマボーナス、Webアプリはまだ未実装です。

## Planned architecture

- `crates/rng-core`: Luaで確認した32-bit RNGと各抽選のRust実装
- `crates/seed-search-cli`: 観測結果から候補を探索する検証用CLI
- `docs`: RNG仕様と検証記録
- `research/upstream`: 上流資料の出典・ハッシュ・取扱記録
- `tests/fixtures`: Lua実装と比較する既知の入出力
- `web`: Rust/WASMを使用するWeb UI（探索PoC成立後に追加）

## Development order

1. ゴグマのセット／グループスキル抽選をRustへ移植する（完了）
2. Lua版と連続結果が一致するgolden testを作る（完了）
3. 既知seedを再発見するCLIを作る
4. 必要な観測数と探索時間を測定する
5. 成立後にWebAssemblyとWeb UIを追加する

## Verification

```powershell
cargo test --workspace --all-targets
cargo clippy --workspace --all-targets -- -D warnings
```

## Attribution

アルゴリズム調査はWiseHorror氏の「Gogma Artian Roll Planner」を参照しています。詳細は`THIRD_PARTY_NOTICES.md`を参照してください。

## License

このリポジトリ自身のライセンスは未選定です。公開・配布前に、上流作品の許諾条件と合わせて決定します。
