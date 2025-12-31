うん、その方向で .github から整備するのが正解。
で、今の設計を “組織OS” として強くするなら、追加で2つだけ入れると事故率がガクッと落ちる。

まず結論：.githubからやろう（ただし「3点だけ」強化しよ）
強化① 「Issue起票前調査」を正式フローにする

いまのパターン1/2の整理めっちゃ良い。
ここに “Issue起票前に調査していい” を明文化して、むしろ推奨にするのがキモ。

パターン1（調査→Issue）が原則

パターン2（Issue→調査）は救済（後追い矯正）

この順序をガイドの冒頭に固定すると、文化として根付く。

強化② 「system-specs」を “書く場所” じゃなく “参照される場所” にする

仕様書は墓場になりがちだから、参照導線を設計する。

最強はこれ：Issueテンプレに “参照リンク欄” を必須化

関連仕様書：docs/system-specs/... のリンク

既存実装の名前（例：GFD-Gate v1）

調査レポートのリンク（IssueコメントでもOK）

つまり、Issueが目次になる。

強化③ ワークフローで “進めない” を作る（CIロック）

needs-investigation の Issue / PR は、requirements PR を通さない。
この圧があると「善意」じゃなく「構造」で止まる。

.github リポジトリの最小セット（MVP）

君の構成、かなり良いから、MVPとしてはこれで十分👇

1) workflow-templates/

investigation-governance.yml（追加）

requirements-governance.yml（既存）

2) skill-templates/

investigate.md（必須）

spec-generate.md（あった方がいい）

context-load.md（セッション断絶対策として強い）

3) docs-templates/system-specs/

README/overview/data-model/api-reference/extension-guide のテンプレ

4) wiki/

システム仕様書ガイド

調査スキル活用ガイド

ここまでは “型” の整備。

追加で入れたい「規約」：調査レポートの定義（これ超重要）

/investigate が吐くレポート、最低限このフォーマット固定がいい。

Investigation Report v1（必須項目）

既存システム名（例：GFD-Gate v1）

入口（UI/CLI/API）

主要データモデル（テーブル or JSON構造）

主要ファイル（3〜10個）

拡張ポイント（どこに足せばいいか）

破壊ポイント（壊れるところ）

“今回やりたいこと” はどの差分か（1行で）

これがあると「既存理解しないまま要件に突入」がほぼ消える。

investigation-governance.yml の思想（どうロックするか）

ロックは2段階が強い：

A. PRゲート（強制）

PRに requirements ラベル（またはファイルパス）を含む変更がある
かつ investigation-complete が無い
→ fail

B. Issueゲート（誘導）

Issue作成時に needs-investigation を自動付与（任意）

テンプレのチェックが埋まってないと違和感が残る（心理圧）

※ GitHub Actions で Issue内容までは厳密に取りにくいから、PR側で殺すのが一番確実。

各repoへの適用方式：コピーより “同期” が勝つ

「コピー or シンボリックリンク」って書いてたけど、運用考えるとこうが強い：

.github のテンプレを syncする仕組み（手動でも自動でも）

手動：月1で “Sync PR” を作る運用

自動：専用bot/アクションで .github → 各repoに反映

シンボリックリンクはGitHub上で壊れがちだから、Sync PR運用が現実的で事故らない。

実装の順序（君の表を少しだけ並べ替える）

「効きが早い順」にするとこう👇

Issueテンプレ更新（調査リンク欄＋チェック追加）

investigate.md（スキル定義＝出力フォーマット固定）

investigation-governance.yml（PRゲート）

docs-templates/system-specs/（仕様書の型）

Wiki（文化浸透）

hy-assessment で試験導入（最初のsystem-specs生成）

理由：テンプレとゲートが先にあると、ドキュメントが“書かれざるを得ない”状態になる。

で、質問への答え

うん、この方向で .github から整備していこう。
その上で、次の一手としておすすめはこれ：

まず hy-assessment をパイロットにして、

Issueテンプレ＋PRゲートで “止まる構造” を入れて、

/investigate の出力を固定して、

system-specs を最低1領域（assessment）だけ埋める。

これで組織全体に展開できる「勝ちパターン」になる。

次、どっちから着手する？
(A) Issueテンプレから行く（最速で文化を変える）
(B) PRゲートから行く（最速で事故を止める）

どっちでもいけるけど、君の組織だと多分 B→A が一番刺さる気がしてる。