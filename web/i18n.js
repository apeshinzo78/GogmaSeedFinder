const LANGUAGE_STORAGE_KEY = "gogma-seed-finder-language-v1";

export const SUPPORTED_LANGUAGES = ["ja", "en", "zh-Hant"];

const OFFICIAL_TERMS = {
  "大剣": ["Great Sword", "大劍"],
  "片手剣": ["Sword & Shield", "單手劍"],
  "双剣": ["Dual Blades", "雙劍"],
  "太刀": ["Long Sword", "太刀"],
  "ハンマー": ["Hammer", "大錘"],
  "狩猟笛": ["Hunting Horn", "狩獵笛"],
  "ランス": ["Lance", "長槍"],
  "ガンランス": ["Gunlance", "銃槍"],
  "スラッシュアックス": ["Switch Axe", "斬擊斧"],
  "チャージアックス": ["Charge Blade", "充能斧"],
  "操虫棍": ["Insect Glaive", "操蟲棍"],
  "弓": ["Bow", "弓"],
  "ヘビィボウガン": ["Heavy Bowgun", "重弩槍"],
  "ライトボウガン": ["Light Bowgun", "輕弩槍"],
  "無属性": ["No Element", "無屬性"],
  "火属性": ["Fire", "火屬性"],
  "水属性": ["Water", "水屬性"],
  "雷属性": ["Thunder", "雷屬性"],
  "氷属性": ["Ice", "冰屬性"],
  "龍属性": ["Dragon", "龍屬性"],
  "毒属性": ["Poison", "毒屬性"],
  "麻痺属性": ["Paralysis", "麻痺屬性"],
  "睡眠属性": ["Sleep", "睡眠屬性"],
  "爆破属性": ["Blast", "爆破屬性"],
  "基礎攻撃力強化Ⅱ": ["Attack Boost II", "基礎攻擊力強化Ⅱ"],
  "基礎攻撃力強化Ⅲ": ["Attack Boost III", "基礎攻擊力強化Ⅲ"],
  "基礎攻撃力強化ＥＸ": ["Attack Boost EX", "基礎攻擊力強化EX"],
  "会心率強化Ⅱ": ["Affinity Boost II", "會心率強化Ⅱ"],
  "会心率強化Ⅲ": ["Affinity Boost III", "會心率強化Ⅲ"],
  "会心率強化ＥＸ": ["Affinity Boost EX", "會心率強化EX"],
  "属性強化Ⅱ": ["Element Boost II", "屬性強化Ⅱ"],
  "属性強化ＥＸ": ["Element Boost EX", "屬性強化EX"],
  "斬れ味強化": ["Sharpness Boost", "銳利度強化"],
  "斬れ味強化ＥＸ": ["Sharpness Boost EX", "銳利度強化EX"],
  "装填強化": ["Ammo Boost", "裝填強化"],
  "装填強化ＥＸ": ["Ammo Boost EX", "裝填強化EX"],
  "攻撃": ["Attack", "攻擊"],
  "会心": ["Affinity", "會心"],
  "属性": ["Element", "屬性"],
  "斬れ味・装填数": ["Sharpness / Ammo", "銳利度／裝填數"],
  "斬れ味": ["Sharpness", "銳利度"],
  "闢獣の力": ["Doshaguma's Might", "闢獸之力"],
  "火竜の力": ["Rathalos's Flare", "火龍之力"],
  "暗器蛸の力": ["Xu Wu's Vigor", "暗器鱆之力"],
  "鎧竜の守護": ["Gravios's Protection", "鎧龍之守護"],
  "雪獅子の闘志": ["Blangonga's Spirit", "雪獅子王之鬥志"],
  "兇爪竜の力": ["Ebony Odogaron's Power", "兇爪龍之力"],
  "雷顎竜の闘志": ["Fulgur Anjanath's Will", "雷顎龍之鬥志"],
  "波衣竜の守護": ["Uth Duna's Cover", "波衣龍之守護"],
  "煌雷竜の力": ["Rey Dau's Voltage", "煌雷龍之力"],
  "獄焔蛸の反逆": ["Nu Udra's Mutiny", "獄焰鱆之叛逆"],
  "凍峰竜の反逆": ["Jin Dahaad's Revolt", "凍峰龍之叛逆"],
  "黒蝕竜の力": ["Gore Magala's Tyranny", "黑蝕龍之力"],
  "鎖刃竜の飢餓": ["Arkveld's Hunger", "鎖刃龍之飢餓"],
  "護鎖刃竜の命脈": ["Guardian Arkveld's Vitality", "護鎖刃龍之命脈"],
  "泡狐竜の力": ["Mizutsune's Prowess", "泡狐龍之力"],
  "白熾龍の脈動": ["Zoh Shia's Pulse", "白熾龍的脈動"],
  "海竜の渦雷": ["Leviathan's Fury", "海龍的渦雷"],
  "千刃竜の闘志": ["Seregios's Tenacity", "千刃龍之鬥志"],
  "巨戟龍の黙示録": ["Gogmapocalypse", "巨戟龍的啟示錄"],
  "暗黒騎士の証": ["Soul of the Dark Knight", "暗黑騎士之證"],
  "オメガレゾナンス": ["Omega Resonance", "歐米茄共鳴"],
  "甲虫の知らせ": ["Neopteron Alert", "甲蟲的直覺"],
  "甲虫の擬態": ["Neopteron Camouflage", "甲蟲的擬態"],
  "革細工の柔性": ["Flexible Leathercraft", "皮革製品的柔韌性"],
  "革細工の滑性": ["Buttery Leathercraft", "皮革製品的滑順質感"],
  "鱗張りの技法": ["Scaling Prowess", "鋪排鱗片的技巧"],
  "鱗重ねの工夫": ["Scale Layering", "堆疊鱗片的手藝"],
  "毛皮の昂揚": ["Fortifying Pelt", "毛皮的昂揚"],
  "毛皮の誘惑": ["Alluring Pelt", "毛皮的誘惑"],
  "ヌシの誇り": ["Lord's Favor", "霸主的自尊"],
  "ヌシの憤激": ["Lord's Fury", "霸主的盛怒"],
  "護竜の脈動": ["Guardian's Pulse", "護龍的脈動"],
  "護竜の守り": ["Guardian's Protection", "護龍的守護"],
  "先達の導き": ["Imparted Wisdom", "前輩的指引"],
  "ヌシの魂": ["Lord's Soul", "霸主之魂"],
  "巨戟復元強化": ["Gogma Reinforce", "巨戟復原強化"],
  "復元ボーナス": ["Reinforcement Bonuses", "復原加成"],
  "ボーナスを同じ構成で再復元": ["Amend (Keep Bonuses)", "保留加成組合並再次復原強化"],
  "ボーナスをリセットして再復元": ["Amend (Reset Bonuses)", "重置加成並再次復原強化"],
};

const UI_TEXT = {
  "巨戟アーティア武器の抽選結果を予測します。": ["Predict Gogma Artian weapon lottery results.", "預測巨戟機械武器的抽選結果。"],
  "現在の制限": ["Current limitations", "目前限制"],
  "現在は手入力版です。ゲーム画面と同じ名称を選んでください。 入力した検索データが外部へ送信されることはありません。": ["This version uses manual input. Select the same names shown in the game. Your search data never leaves this device.", "目前為手動輸入版。請選擇與遊戲畫面相同的名稱。輸入的搜尋資料不會傳送至外部。"],
  "現在のセーブ状態": ["Current Save State", "目前的存檔狀態"],
  "未特定": ["Unknown", "尚未確定"],
  "基準seed": ["Base Seed", "基準seed"],
  "復元ボーナスカウンター": ["Reinforcement Bonus Counter", "復原加成計數器"],
  "スキルカウンター": ["Skill Counter", "技能計數器"],
  "検索または手入力が必要": ["Search or enter manually", "需要搜尋或手動輸入"],
  "スキル結果から特定": ["Identify from skill results", "從技能結果中確定"],
  "メモ推奨": ["Write this down", "建議另行記錄"],
  "基準seedと2つのカウンターはこのブラウザに自動保存されます。ブラウザのデータ削除や端末変更に備え、セーブ状態コードも別途控えてください。": ["The base seed and both counters are saved automatically in this browser. Also keep a copy of the save-state code in case browser data is cleared or you change devices.", "基準seed與兩個計數器會自動儲存在此瀏覽器中。為防止瀏覽器資料遭刪除或更換裝置，也請另外保存存檔狀態代碼。"],
  "基準seed・各カウンターを手入力で設定": ["Set the base seed and counters manually", "手動設定基準seed與各計數器"],
  "すでに値が分かっている場合は、検索せずに現在のセーブ状態へ設定できます。 分からないカウンターは空欄のままにできます。": ["If you already know the values, set the current save state without searching. Leave unknown counters blank.", "若已知數值，可不經搜尋直接設定目前的存檔狀態。不知道的計數器可留白。"],
  "未特定なら空欄": ["Leave blank if unknown", "未知時請留白"],
  "現在の状態に設定": ["Set Current State", "設為目前狀態"],
  "セーブ状態コードで引き継ぐ": ["Transfer with a save-state code", "使用存檔狀態代碼轉移"],
  "状態コードは基準seedと特定済みカウンターをまとめた、このツール専用の引き継ぎコードです。": ["A save-state code bundles the base seed and identified counters for transfer within this tool.", "存檔狀態代碼會整合基準seed與已確定的計數器，供本工具轉移狀態使用。"],
  "セーブ状態コード": ["Save-State Code", "存檔狀態代碼"],
  "状態を読み込む": ["Load State", "讀取狀態"],
  "機能を選択": ["Choose a feature", "選擇功能"],
  "使い方": ["Guide", "使用方法"],
  "seed・復元カウンター検索": ["Seed & Bonus Counter Search", "seed與復原計數器搜尋"],
  "スキルカウンター特定": ["Find Skill Counter", "確定技能計數器"],
  "復元ボーナス未来予測": ["Bonus Forecast", "復原加成未來預測"],
  "スキル未来予測": ["Skill Forecast", "技能未來預測"],
  "基準seedと2つのカウンター": ["Base Seed and Two Counters", "基準seed與兩個計數器"],
  "セーブ固有seed＋2つの保存位置": ["One save-specific seed + two saved positions", "存檔專屬seed＋兩個保存位置"],
  "基準seedはセーブデータ固有の値です。復元ボーナスとスキルの抽選は同じ基準seedを使い、 それぞれの現在位置は「復元ボーナスカウンター」と「スキルカウンター」として別々に保存されます。": ["The base seed is unique to your save data. Reinforcement bonuses and skills use the same base seed, but their current positions are saved separately as the Reinforcement Bonus Counter and Skill Counter.", "基準seed是存檔資料的專屬數值。復原加成與技能抽選使用相同的基準seed，但目前位置會分別保存為「復原加成計數器」與「技能計數器」。"],
  "このセーブデータに固有・保存される共通キー": ["Shared key unique to this save data", "此存檔資料專屬且會保存的共用鍵值"],
  "基準seed 86,315,169（例）": ["Base Seed 86,315,169 (example)", "基準seed 86,315,169（範例）"],
  "武器種・属性を組み合わせて、その組み合わせ専用の抽選列を作ります（結果例：火属性スラッシュアックス）": ["Each weapon type and element combination produces its own result stream (example: Fire Switch Axe).", "武器種類與屬性的組合會產生專用的抽選序列（結果範例：火屬性斬擊斧）。"],
  "復元ボーナス抽選列": ["Reinforcement Bonus Stream", "復原加成抽選序列"],
  "シリーズ・グループスキル抽選列": ["Series / Group Skill Stream", "系列／團體技能抽選序列"],
  "セーブデータに保存": ["Saved in save data", "保存在存檔資料中"],
  "復元専用の現在位置": ["Current bonus position", "復原專用的目前位置"],
  "スキル専用の現在位置": ["Current skill position", "技能專用的目前位置"],
  "復元ボーナスを1回抽選すると、このカウンターだけが1つ進みます。": ["Each bonus roll advances only this counter by one.", "每抽選一次復原加成，只有此計數器會前進1。"],
  "スキルを1回再付与すると、このカウンターだけが1つ進みます。": ["Each skill reset advances only this counter by one.", "每重新附加一次技能，只有此計數器會前進1。"],
  "復元ボーナスカウンターが進む例": ["Example of the bonus counter advancing", "復原加成計數器前進的範例"],
  "スキルカウンターが進む例": ["Example of the skill counter advancing", "技能計數器前進的範例"],
  "抽選前": ["Before rolling", "抽選前"],
  "再付与前": ["Before reset", "重新附加前"],
  "カウンター 480": ["Counter 480", "計數器 480"],
  "カウンター 481": ["Counter 481", "計數器 481"],
  "カウンター 482": ["Counter 482", "計數器 482"],
  "カウンター 33": ["Counter 33", "計數器 33"],
  "カウンター 34": ["Counter 34", "計數器 34"],
  "カウンター 35": ["Counter 35", "計數器 35"],
  "1回抽選": ["Roll once", "抽選1次"],
  "さらに1回抽選": ["Roll once more", "再抽選1次"],
  "1回抽選した後": ["After 1 roll", "抽選1次後"],
  "2回抽選した後": ["After 2 rolls", "抽選2次後"],
  "1回再付与": ["Reset once", "重新附加1次"],
  "さらに1回再付与": ["Reset once more", "再重新附加1次"],
  "1回再付与した後": ["After 1 reset", "重新附加1次後"],
  "2回再付与した後": ["After 2 resets", "重新附加2次後"],
  "武器種・属性を変えると結果は変わりますが、カウンターは全武器で共有されます。 表示した結果は仕組みを説明する例です。「ボーナスをリセットして再復元」と「スキル再付与」は、同じ武器種・属性なら武器個体が違っても同じ結果です。「ボーナスを同じ構成で再復元」は各武器の現在5枠構成も使います。": ["Results change with weapon type and element, while counters are shared by all weapons. The displayed results are examples. Amend (Reset Bonuses) and Reset Skills produce the same result for the same weapon type and element, even on different weapons. Amend (Keep Bonuses) also uses each weapon's current five-slot composition.", "結果會隨武器種類與屬性改變，但計數器由所有武器共用。畫面結果僅為說明機制的範例。相同武器種類與屬性下，即使是不同武器，「重置加成並再次復原強化」與「重新附加技能」的結果也相同。「保留加成組合並再次復原強化」還會使用各武器目前的5格組合。"],
  "使用手順": ["Usage steps", "使用步驟"],
  "検索で基準seed・復元カウンターを特定": ["Find the Base Seed and Bonus Counter", "搜尋基準seed與復原計數器"],
  "結果からスキルカウンターを特定": ["Find the Skill Counter", "從結果確定技能計數器"],
  "未来予測から欲しい結果を採用": ["Use a Desired Forecast Result", "採用未來預測中的目標結果"],
  "「ボーナスをリセットして再復元」の直前でセーブします。": ["Save immediately before Amend (Reset Bonuses).", "在「重置加成並再次復原強化」前立即存檔。"],
  "同じ武器で「ボーナスをリセットして再復元」を連続6回行い、各回の5枠を記録します。": ["Use Amend (Reset Bonuses) six consecutive times on the same weapon and record all five slots each time.", "使用同一把武器連續進行6次「重置加成並再次復原強化」，並記錄每次的5格結果。"],
  "セーブせずにゲームを終了し、「seed・復元カウンター検索」タブへ入力します。": ["Quit without saving, then enter the results in the Seed & Bonus Counter Search tab.", "不存檔並結束遊戲，再將結果輸入「seed與復原計數器搜尋」分頁。"],
  "同じ元セーブをロードします。": ["Load the same original save.", "載入相同的原始存檔。"],
  "同じ武器で「スキル再付与」を連続2回以上行い、シリーズ・グループスキルを記録します。": ["Use Reset Skills at least twice consecutively on the same weapon and record the Series and Group Skills.", "使用同一把武器連續進行至少2次「重新附加技能」，並記錄系列與團體技能。"],
  "セーブせずにゲームを終了し、「スキルカウンター特定」タブへ入力します。": ["Quit without saving, then enter the results in the Find Skill Counter tab.", "不存檔並結束遊戲，再將結果輸入「確定技能計數器」分頁。"],
  "「復元ボーナス未来予測」または「スキル未来予測」タブで、狙う武器種・属性を登録します。": ["Register the desired weapon types and elements in the Bonus Forecast or Skill Forecast tab.", "在「復原加成未來預測」或「技能未來預測」分頁中登錄目標武器種類與屬性。"],
  "ゲーム内で再復元またはスキル再付与を行い、欲しい結果が出る「○回先」まで進めます。": ["In the game, repeat the relevant amendment or skill reset until the desired result's “rolls ahead” position.", "在遊戲中進行再次復原強化或重新附加技能，前進至出現目標結果的「○次後」。"],
  "欲しい結果を確認して採用し、セーブします。": ["Confirm and accept the desired result, then save.", "確認並採用目標結果後存檔。"],
  "その行の「ここを0にする」を押すと、セーブした位置から続きを予測できます。": ["Click “Set as 0” on that row to continue forecasting from the saved position.", "按下該列的「設為0」，即可從已存檔的位置繼續預測。"],
  "複数武器を比較して、効率よく厳選する": ["Compare Multiple Weapons and Farm Efficiently", "比較多把武器，高效率嚴選"],
  "スキルカウンターは全武器で共有されます。先に複数の武器種・属性を登録し、欲しい結果が出る位置をまとめて確認すると、素材と時間を節約できます。": ["The Skill Counter is shared by all weapons. Register multiple weapon type and element combinations to compare where desired results appear and save materials and time.", "技能計數器由所有武器共用。先登錄多組武器種類與屬性，一次確認目標結果的位置，即可節省素材與時間。"],
  "スキル未来予測の出力例": ["Skill Forecast example", "技能未來預測輸出範例"],
  "最初の0から": ["From initial 0", "從最初的0開始"],
  "龍太刀": ["Dragon Long Sword", "龍屬性太刀"],
  "火太刀": ["Fire Long Sword", "火屬性太刀"],
  "20回先": ["20 rolls ahead", "20次後"],
  "44回先": ["44 rolls ahead", "44次後"],
  "ここで採用・セーブ": ["Accept and save here", "在此採用並存檔"],
  "次に採用・セーブ": ["Accept and save next", "接著採用並存檔"],
  "別の結果": ["Different result", "其他結果"],
  "素材を節約する厳選手順": ["Efficient farming flow", "節省素材的嚴選流程"],
  "開始": ["Start", "開始"],
  "2武器を登録": ["Register 2 weapons", "登錄2把武器"],
  "龍太刀・火太刀を同じ0地点から比較": ["Compare Dragon and Fire Long Swords from the same origin", "從相同0點比較龍屬性與火屬性太刀"],
  "20回進める": ["Advance 20 rolls", "前進20次"],
  "龍太刀を採用": ["Accept Dragon Long Sword", "採用龍屬性太刀"],
  "黒蝕竜の力＋ヌシの魂でセーブ": ["Save with Gore Magala's Tyranny + Lord's Soul", "以黑蝕龍之力＋霸主之魂存檔"],
  "新しい0地点": ["New origin", "新的0點"],
  "「ここを0にする」": ["“Set as 0”", "「設為0」"],
  "最初の44回先は、ここから24回先": ["The original roll 44 is now 24 rolls ahead", "原本的第44次現在是24次後"],
  "24回進める": ["Advance 24 rolls", "前進24次"],
  "火太刀を採用": ["Accept Fire Long Sword", "採用火屬性太刀"],
  "雷顎竜の闘志＋ヌシの魂でセーブ": ["Save with Fulgur Anjanath's Will + Lord's Soul", "以雷顎龍之鬥志＋霸主之魂存檔"],
  "抽選するたびにカウンターは進みます。観測後にセーブすると進んだ位置が保存されるため、元の状態に戻す場合はセーブせずにゲームを終了してください。": ["The counter advances with every roll. Saving after observation stores the advanced position, so quit without saving if you need to return to the original state.", "每次抽選都會推進計數器。觀測後若存檔，推進後的位置也會被保存；若要回到原本狀態，請不存檔並結束遊戲。"],
  "基準seed＋復元ボーナスカウンター検索": ["Base Seed + Bonus Counter Search", "基準seed＋復原加成計數器搜尋"],
  "スラアク入力例": ["Switch Axe Example", "斬擊斧輸入範例"],
  "弓入力例": ["Bow Example", "弓輸入範例"],
  "ヘビィ入力例": ["Heavy Bowgun Example", "重弩槍輸入範例"],
  "セーブ地点から連続して確認した復元ボーナスを入力し、基準seedとその時点の復元ボーナスカウンターを同時に検索します。": ["Enter consecutive reinforcement bonus results observed from the save point to search for the base seed and the Bonus Counter at that point.", "輸入從存檔點連續觀測到的復原加成結果，同時搜尋基準seed與當時的復原加成計數器。"],
  "観測した武器種": ["Observed Weapon Type", "觀測的武器種類"],
  "観測した武器の属性": ["Observed Weapon Element", "觀測武器的屬性"],
  "観測した属性": ["Observed Element", "觀測的屬性"],
  "復元ボーナスカウンターはセーブごとに異なります": ["The Bonus Counter Differs for Every Save", "每個存檔的復原加成計數器都不同"],
  "実測サンプルの": ["The measured sample", "實測範例中的"],
  "は全ユーザー共通ではありません。これまでこのセーブデータで復元ボーナスを抽選した、おおよその累計回数が含まれるように探索範囲を設定してください。": ["is not shared by all users. Set a search range that includes the approximate total number of bonus rolls made on this save.", "並非所有使用者共通。請設定搜尋範圍，使其包含此存檔至今抽選復原加成的大約累計次數。"],
  "推定した現在値": ["Estimated Current Value", "推測的目前值"],
  "前後に探す幅": ["Search Radius", "前後搜尋範圍"],
  "探索範囲に反映": ["Apply to Search Range", "套用至搜尋範圍"],
  "±5（11候補）": ["±5 (11 candidates)", "±5（11個候選）"],
  "±25（51候補）": ["±25 (51 candidates)", "±25（51個候選）"],
  "±50（101候補）": ["±50 (101 candidates)", "±50（101個候選）"],
  "±250（501候補・長時間）": ["±250 (501 candidates; slower)", "±250（501個候選・耗時較長）"],
  "±500（1,001候補・非常に長時間）": ["±500 (1,001 candidates; very slow)", "±500（1,001個候選・非常耗時）"],
  "±1000（2,001候補・非常に長時間）": ["±1000 (2,001 candidates; very slow)", "±1000（2,001個候選・非常耗時）"],
  "復元ボーナスカウンターの探索範囲・実行設定": ["Bonus Counter Search Range & Execution", "復原加成計數器搜尋範圍與執行設定"],
  "開始・終了は手動でも変更できます。正確な現在値は検索結果から決まります。範囲幅を広げると探索時間もほぼ比例して増えます。": ["You can edit the start and end manually. The exact current value is determined by the search result. Search time grows roughly in proportion to the range.", "可手動修改開始與結束值。正確的目前值由搜尋結果決定。範圍越大，搜尋時間也會近乎等比例增加。"],
  "復元カウンター（開始）": ["Bonus Counter (Start)", "復原計數器（開始）"],
  "復元カウンター（終了）": ["Bonus Counter (End)", "復原計數器（結束）"],
  "基準seed候補（開始）": ["Base Seed Candidate (Start)", "基準seed候選（開始）"],
  "基準seed候補（終了）": ["Base Seed Candidate (End)", "基準seed候選（結束）"],
  "並列Worker数": ["Parallel Workers", "平行Worker數"],
  "連続した復元ボーナス結果": ["Consecutive Reinforcement Bonus Results", "連續的復原加成結果"],
  "1回につき5枠（狭い画面では上から1〜5枠）": ["5 slots per roll (slots 1–5 from top on narrow screens)", "每次5格（窄畫面中由上至下為第1～5格）"],
  "抽選結果を1回追加": ["Add One Roll", "新增1次抽選結果"],
  "最後の1回を削除": ["Remove Last Roll", "刪除最後1次"],
  "基準seedとカウンターを検索": ["Search Base Seed and Counter", "搜尋基準seed與計數器"],
  "中止": ["Cancel", "取消"],
  "検索結果": ["Search Results", "搜尋結果"],
  "待機中": ["Waiting", "等待中"],
  "進捗": ["Progress", "進度"],
  "確認seed": ["Seeds Checked", "已確認seed"],
  "経過時間": ["Elapsed", "經過時間"],
  "候補": ["Candidates", "候選"],
  "入力を確認して検索を開始してください。": ["Check your input and start the search.", "請確認輸入內容並開始搜尋。"],
  "観測結果を入力してください": ["Enter observed results", "請輸入觀測結果"],
  "現在の基準seedを使い、セーブ地点から連続して確認したシリーズ・グループスキルからスキルカウンターを特定します。復元ボーナスカウンターは変化しません。": ["Use the current base seed and consecutive Series / Group Skill results observed from the save point to identify the Skill Counter. The Bonus Counter does not change.", "使用目前的基準seed與從存檔點連續觀測到的系列／團體技能，確定技能計數器。復原加成計數器不會改變。"],
  "使用する基準seed": ["Base Seed to Use", "使用的基準seed"],
  "連続したスキル再付与結果": ["Consecutive Reset Skills Results", "連續的技能重新附加結果"],
  "左がシリーズ、右がグループです。": ["Series is on the left; Group is on the right.", "左側為系列，右側為團體。"],
  "スキル結果を1回追加": ["Add One Skill Result", "新增1次技能結果"],
  "スキルカウンターの探索範囲": ["Skill Counter Search Range", "技能計數器搜尋範圍"],
  "通常は変更不要です。候補0件の場合に範囲を広げます。": ["Normally no change is needed. Increase the range if there are no candidates.", "通常不需修改。候選為0時再擴大範圍。"],
  "カウンター候補（開始）": ["Counter Candidate (Start)", "計數器候選（開始）"],
  "カウンター候補（終了）": ["Counter Candidate (End)", "計數器候選（結束）"],
  "スキルカウンターを特定": ["Find Skill Counter", "確定技能計數器"],
  "状態と予測対象を設定してください": ["Set the state and forecast targets", "請設定狀態與預測目標"],
  "予測の基準状態": ["Forecast Origin", "預測的基準狀態"],
  "復元抽選では変化しません": ["Unaffected by bonus rolls", "復原抽選不會改變"],
  "スキル抽選では変化しません": ["Unaffected by skill rolls", "技能抽選不會改變"],
  "この状態で予測": ["Forecast from This State", "從此狀態預測"],
  "ゲーム内で行う再復元": ["Amendment Method Used In Game", "遊戲內進行的再次復原強化"],
  "まずリセットで希望の構成を探し、その構成を引き継いでEX厳選へ進めます。": ["First find the desired composition by resetting bonuses, then keep that composition while farming EX tiers.", "先重置加成以尋找目標組合，再保留該組合進行EX嚴選。"],
  "再復元の方法": ["Amendment method", "再次復原強化方式"],
  "全候補から5枠の構成を抽選": ["Roll a five-slot composition from all candidates", "從所有候選中抽選5格組合"],
  "5枠の系統を維持してII・III・EX等を抽選": ["Keep all five bonus types and reroll II / III / EX tiers", "保留5格系統並抽選II／III／EX等階級"],
  "EX未厳選武器ごとの現在構成": ["Current Composition of Each Weapon Awaiting EX Farming", "各把尚未嚴選EX武器的目前組合"],
  "登録した各武器について、ゲーム画面の左から順に5枠の系統を選びます。II・III・EXの入力は不要です。": ["For each registered weapon, select the five bonus types from left to right as shown in game. You do not need to enter II, III, or EX.", "請為每把已登錄武器依遊戲畫面由左至右選擇5格系統。不需輸入II、III或EX。"],
  "武器ごとに構成を入力": ["Enter each weapon's composition", "輸入各武器組合"],
  "同じ武器種・属性でも、別の武器プロファイルとして複数登録できます。無属性武器とボウガンには属性系、弓には斬れ味・装填系の構成を使用できません。": ["You may register multiple profiles with the same weapon type and element. Element bonuses cannot be used for non-element weapons or bowguns; Sharpness / Ammo bonuses cannot be used for bows.", "即使武器種類與屬性相同，也可登錄多個不同武器設定。無屬性武器與弩槍不可使用屬性系，弓不可使用銳利度／裝填系組合。"],
  "登録した武器種・属性を一覧比較": ["Compare Registered Weapon / Element Targets", "比較已登錄的武器種類／屬性"],
  "リセット抽選は武器種・属性が同じなら同じ結果です。「ボーナスを同じ構成で再復元」でEXを厳選する場合は、同じ武器種・属性の別武器も表示名を付けて複数登録できます。": ["Reset rolls are identical for the same weapon type and element. When farming EX with Amend (Keep Bonuses), give separate weapons with the same type and element different display names and register them individually.", "相同武器種類與屬性的重置抽選結果相同。使用「保留加成組合並再次復原強化」嚴選EX時，可為相同武器種類與屬性的不同武器設定顯示名稱並分別登錄。"],
  "表示名（任意）": ["Display Name (Optional)", "顯示名稱（選填）"],
  "例：火太刀": ["Example: Fire Long Sword", "例：火屬性太刀"],
  "武器種": ["Weapon Type", "武器種類"],
  "表示する回数": ["Number of Rolls", "顯示次數"],
  "この組み合わせを登録": ["Register This Combination", "登錄此組合"],
  "登録をすべて削除": ["Remove All", "全部刪除"],
  "EX数で絞り込む": ["Filter by EX Count", "依EX數量篩選"],
  "いずれかの登録武器が最低EX数を満たす行だけ表示します。": ["Show only rows where at least one registered weapon meets the minimum EX count.", "僅顯示至少一把已登錄武器達到最低EX數量的列。"],
  "最低EX数": ["Minimum EX Count", "最低EX數量"],
  "1個以上": ["1 or more", "1個以上"],
  "2個以上": ["2 or more", "2個以上"],
  "3個以上": ["3 or more", "3個以上"],
  "4個以上": ["4 or more", "4個以上"],
  "5個": ["5", "5個"],
  "条件に合う行だけ表示": ["Show Matching Rows Only", "僅顯示符合條件的列"],
  "表示中の結果をCSV出力": ["Export Visible Results to CSV", "將顯示中的結果匯出為CSV"],
  "1カウンターを1行にし、登録武器ごとに5枠分の列を追加します。EX絞り込みがONの場合は、現在表示中の行だけを出力します。": ["Exports one counter per row with five columns per registered weapon. If EX filtering is on, only visible rows are exported.", "每個計數器輸出一列，並為每把已登錄武器增加5格欄位。開啟EX篩選時，只輸出目前顯示的列。"],
  "「この位置を新しい0にする」は、ゲーム内でその結果まで進めてセーブした場合に使用してください。リセット結果の「この構成でEX厳選へ」は、保存後カウンターと5枠構成をまとめて引き継ぎます。": ["Use “Set This Position as New 0” only after reaching and saving that result in game. “Farm EX with This Composition” carries over both the post-save counter and all five bonus types.", "只有在遊戲中推進至該結果並存檔後，才使用「將此位置設為新的0」。重置結果中的「以此組合嚴選EX」會一併繼承存檔後計數器與5格組合。"],
  "1条件を詳しく絞り込む": ["Detailed Filter for One Target", "詳細篩選單一條件"],
  "状態待ち": ["Waiting for state", "等待狀態"],
  "予測の起点": ["Forecast origin", "預測起點"],
  "現在地点": ["Current Position", "目前位置"],
  "予測する武器種": ["Weapon Type to Forecast", "預測的武器種類"],
  "予測する属性": ["Element to Forecast", "預測的屬性"],
  "希望ボーナス": ["Desired Bonuses", "目標加成"],
  "「ボーナスをリセットして再復元」で欲しい系統構成を順不同で探します。例：攻撃×4＋斬れ味×1": ["Find the desired bonus-type composition in any order for Amend (Reset Bonuses). Example: Attack ×4 + Sharpness ×1", "以順序不限的方式搜尋「重置加成並再次復原強化」的目標系統組合。例：攻擊×4＋銳利度×1"],
  "強化段階を区別しない（系統構成を順不同で検索）": ["Ignore Tiers (Match Bonus Types in Any Order)", "忽略強化階級（以順序不限搜尋系統組合）"],
  "一致結果だけ表示": ["Show Matches Only", "僅顯示符合結果"],
  "何回先": ["Rolls Ahead", "幾次後"],
  "保存後の状態": ["State After Saving", "存檔後狀態"],
  "1枠目": ["Slot 1", "第1格"],
  "2枠目": ["Slot 2", "第2格"],
  "3枠目": ["Slot 3", "第3格"],
  "4枠目": ["Slot 4", "第4格"],
  "5枠目": ["Slot 5", "第5格"],
  "当たり強調・条件一致だけ表示": ["Highlight Hits / Show Matches Only", "強調目標／僅顯示符合結果"],
  "シリーズの複数選択はORで判定します。同じ条件を強調表示と行の絞り込みに使用します。": ["Multiple Series Skills are combined with OR. The same condition is used for highlighting and row filtering.", "選擇多個系列技能時以OR判定。同一條件用於強調顯示與列篩選。"],
  "グループスキル": ["Group Skill", "團體技能"],
  "シリーズスキル": ["Series Skill", "系列技能"],
  "カウンター位置": ["Counter Position", "計數器位置"],
  "シリーズ群との条件": ["Combine with Series", "與系列技能的條件"],
  "AND（両方一致）": ["AND (Both Match)", "AND（兩者皆符合）"],
  "OR（どちらか一致）": ["OR (Either Matches)", "OR（任一符合）"],
  "シリーズスキル（複数選択はOR）": ["Series Skills (Multiple Selections Use OR)", "系列技能（多選時為OR）"],
  "条件に合う要素だけ強調表示": ["Highlight Matching Skills", "僅強調符合條件的技能"],
  "1カウンターを1行にし、登録武器ごとにシリーズ・グループの列を追加します。フィルターがONの場合は、現在表示中の行だけを出力します。": ["Exports one counter per row with Series and Group columns for each registered weapon. If filtering is on, only visible rows are exported.", "每個計數器輸出一列，並為每把已登錄武器增加系列與團體欄位。開啟篩選時，只輸出目前顯示的列。"],
  "スキル結果を採用してセーブした場合は、その行を新しい0地点にできます。復元ボーナスカウンターは維持されます。": ["After accepting and saving a skill result, you can set that row as the new origin. The Bonus Counter is preserved.", "採用技能結果並存檔後，可將該列設為新的0點。復原加成計數器會維持不變。"],
  "不具合や分かりにくい点があれば、": ["If you find a bug or anything unclear, let us know through ", "若發現錯誤或難以理解之處，請透過"],
  "でお知らせください。": [".", "告知我們。"],
  "選択してください": ["Select an option", "請選擇"],
  "指定なし": ["Any", "不指定"],
  "シリーズを選択": ["Select a Series Skill", "選擇系列技能"],
  "グループを選択": ["Select a Group Skill", "選擇團體技能"],
  "系統を選択": ["Select a Bonus Type", "選擇加成系統"],
  "現在構成を入力": ["Enter current composition", "輸入目前組合"],
  "コード": ["Code", "代碼"],
  "ここを0にする": ["Set as 0", "設為0"],
  "この位置を新しい0にする": ["Set This Position as New 0", "將此位置設為新的0"],
  "この構成でEX厳選へ": ["Farm EX with This Composition", "以此組合嚴選EX"],
  "実測一致": ["Observed Match", "實測一致"],
  "探索中": ["Searching", "搜尋中"],
  "有効な開始・終了を入力してください。": ["Enter a valid start and end value.", "請輸入有效的開始與結束值。"],
  "完了": ["Complete", "完成"],
  "エラー": ["Error", "錯誤"],
  "未来を計算中": ["Calculating forecast", "正在計算未來結果"],
  "予測エラー": ["Forecast error", "預測錯誤"],
  "比較表を計算中": ["Calculating comparison", "正在計算比較表"],
  "予測対象を登録してください": ["Register a forecast target", "請登錄預測目標"],
  "スキルカウンターを探索中": ["Searching for Skill Counter", "正在搜尋技能計數器"],
  "位置未特定": ["Position unknown", "位置尚未確定"],
  "スキル未来を計算中": ["Calculating skill forecast", "正在計算技能未來結果"],
  "検索結果から設定": ["Set from search results", "由搜尋結果設定"],
  "手入力から設定": ["Set manually", "由手動輸入設定"],
  "状態コードから設定": ["Set from save-state code", "由存檔狀態代碼設定"],
  "予測結果から設定": ["Set from forecast result", "由預測結果設定"],
  "指定しない": ["Any", "不指定"],
  "保存後の復元ボーナスカウンター": ["Bonus Counter After Saving", "存檔後的復原加成計數器"],
  "保存後のスキルカウンター": ["Skill Counter After Saving", "存檔後的技能計數器"],
  "復元": ["Bonus", "復原"],
  "スキル": ["Skill", "技能"],
  "攻II": ["Atk II", "攻II"],
  "攻III": ["Atk III", "攻III"],
  "攻EX": ["Atk EX", "攻EX"],
  "会II": ["Aff II", "會II"],
  "会III": ["Aff III", "會III"],
  "会EX": ["Aff EX", "會EX"],
  "属II": ["Ele II", "屬II"],
  "属EX": ["Ele EX", "屬EX"],
  "斬I": ["Shp", "銳"],
  "斬EX": ["Shp EX", "銳EX"],
  "装I": ["Ammo", "裝"],
  "装EX": ["Ammo EX", "裝EX"],
  "予測結果を表示するとCSVへ出力できます。": ["Display forecast results to enable CSV export.", "顯示預測結果後即可匯出CSV。"],
  "近接武器は攻撃・会心・属性・斬れ味の10候補です。": ["Melee weapons use 10 Attack, Affinity, Element, and Sharpness candidates.", "近戰武器使用攻擊、會心、屬性與銳利度共10個候選。"],
  "無属性の近接武器は攻撃・会心・斬れ味の8候補です。属性強化は抽選されません。": ["Non-element melee weapons use 8 Attack, Affinity, and Sharpness candidates. Element Boost is not rolled.", "無屬性近戰武器使用攻擊、會心與銳利度共8個候選，不會抽到屬性強化。"],
  "弓は攻撃・会心・属性の8候補です。斬れ味・装填系は抽選されません。": ["Bows use 8 Attack, Affinity, and Element candidates. Sharpness / Ammo bonuses are not rolled.", "弓使用攻擊、會心與屬性共8個候選，不會抽到銳利度／裝填系。"],
  "無属性の弓は攻撃・会心の6候補です。属性強化と斬れ味・装填系は抽選されません。": ["Non-element bows use 6 Attack and Affinity candidates. Element and Sharpness / Ammo bonuses are not rolled.", "無屬性弓使用攻擊與會心共6個候選，不會抽到屬性強化與銳利度／裝填系。"],
  "ボウガンは攻撃・会心・装填の8候補です。属性強化は抽選されず、装填系は合計2枠までです。": ["Bowguns use 8 Attack, Affinity, and Ammo candidates. Element Boost is not rolled, and Ammo bonuses are limited to two slots total.", "弩槍使用攻擊、會心與裝填共8個候選，不會抽到屬性強化，且裝填系合計最多2格。"],
  "近接武器の未来は攻撃・会心・属性・斬れ味の10候補で計算します。": ["Melee forecasts use 10 Attack, Affinity, Element, and Sharpness candidates.", "近戰武器的未來結果以攻擊、會心、屬性與銳利度共10個候選計算。"],
  "無属性の近接武器は攻撃・会心・斬れ味の8候補で計算します。属性強化は出ません。": ["Non-element melee forecasts use 8 Attack, Affinity, and Sharpness candidates. Element Boost will not appear.", "無屬性近戰武器的未來結果以攻擊、會心與銳利度共8個候選計算，不會出現屬性強化。"],
  "弓の未来は攻撃・会心・属性の8候補で計算します。斬れ味・装填系は出ません。": ["Bow forecasts use 8 Attack, Affinity, and Element candidates. Sharpness / Ammo bonuses will not appear.", "弓的未來結果以攻擊、會心與屬性共8個候選計算，不會出現銳利度／裝填系。"],
  "無属性の弓は攻撃・会心の6候補で計算します。属性強化と斬れ味・装填系は出ません。": ["Non-element bow forecasts use 6 Attack and Affinity candidates. Element and Sharpness / Ammo bonuses will not appear.", "無屬性弓的未來結果以攻擊與會心共6個候選計算，不會出現屬性強化與銳利度／裝填系。"],
  "ボウガンの未来は攻撃・会心・装填の8候補で計算します。属性強化は出ません。": ["Bowgun forecasts use 8 Attack, Affinity, and Ammo candidates. Element Boost will not appear.", "弩槍的未來結果以攻擊、會心與裝填共8個候選計算，不會出現屬性強化。"],
  "「ボーナスを同じ構成で再復元」は、登録武器ごとの5枠系統を維持したままII・III・EX等だけを再抽選します。": ["Amend (Keep Bonuses) preserves each registered weapon's five bonus types and rerolls only II, III, EX, and similar tiers.", "「保留加成組合並再次復原強化」會維持各把已登錄武器的5格系統，只重新抽選II、III、EX等階級。"],
  "「ボーナスを同じ構成で再復元」の未来は武器一覧で比較します": ["Compare Amend (Keep Bonuses) forecasts in the registered weapons table.", "請在已登錄武器一覽表中比較「保留加成組合並再次復原強化」的未來結果。"],
  "Ⅱ・Ⅲ・EXまで含めて、欲しいボーナスを順不同で指定します。": ["Specify desired bonuses, including II, III, and EX tiers, in any order.", "以順序不限指定包含Ⅱ、Ⅲ與EX階級的目標加成。"],
  "5枠すべて選択してください": ["Select all five slots", "請選擇全部5格"],
  "5枠の現在構成を入力してください。": ["Enter the current five-slot composition.", "請輸入目前的5格組合。"],
  "先にEX厳選する武器を登録してください。": ["Register a weapon for EX farming first.", "請先登錄要嚴選EX的武器。"],
  "武器登録待ち": ["Waiting for weapon registration", "等待登錄武器"],
  "ボウガンには属性系を設定できません。": ["Element bonuses cannot be assigned to bowguns.", "弩槍不可設定屬性系。"],
  "弓には斬れ味・装填系を設定できません。": ["Sharpness / Ammo bonuses cannot be assigned to bows.", "弓不可設定銳利度／裝填系。"],
  "無属性武器には属性系を設定できません。": ["Element bonuses cannot be assigned to non-element weapons.", "無屬性武器不可設定屬性系。"],
  "属性系は合計4枠までです。": ["Element bonuses are limited to four slots total.", "屬性系合計最多4格。"],
  "斬れ味・装填系は合計2枠までです。": ["Sharpness / Ammo bonuses are limited to two slots total.", "銳利度／裝填系合計最多2格。"],
  "装填": ["Ammo", "裝填"],
  "装填数": ["Ammo Capacity", "裝填數"],
  "装填数強化 +1": ["Ammo Capacity Boost +1", "裝填數強化 +1"],
  "装填系": ["Ammo", "裝填系"],
  "斬れ味系": ["Sharpness", "銳利度系"],
  "候補を探索しています…": ["Searching for candidates…", "正在搜尋候選…"],
  "状態コード読込": ["State Code Loaded", "已讀取狀態代碼"],
  "現在の状態": ["Current State", "目前狀態"],
  "この状態を使用": ["Use This State", "使用此狀態"],
  "入力した値を現在のセーブ状態に設定しました。空欄のカウンターは未特定として扱います。": ["The entered values are now the current save state. Blank counters remain unknown.", "已將輸入值設為目前的存檔狀態。留白的計數器視為尚未確定。"],
  "入力した基準seedと復元ボーナスカウンターを0地点として予測しました。": ["Forecasting with the entered base seed and Bonus Counter as origin 0.", "已將輸入的基準seed與復原加成計數器設為0點進行預測。"],
  "入力した基準seedとスキルカウンターを0地点として予測しました。": ["Forecasting with the entered base seed and Skill Counter as origin 0.", "已將輸入的基準seed與技能計數器設為0點進行預測。"],
  "状態を読み込みました。基準seedと2つのカウンターを引き継いでいます。": ["State loaded. The base seed and both counters were restored.", "已讀取狀態，並繼承基準seed與兩個計數器。"],
  "状態を読み込みました。基準seedと復元ボーナスカウンターを引き継いでいます。": ["State loaded. The base seed and Bonus Counter were restored.", "已讀取狀態，並繼承基準seed與復原加成計數器。"],
  "セーブ状態コードは GSF2-B基準seed-G復元カウンター-Sスキルカウンター、またはGSF1形式で入力してください。": ["Enter a save-state code in GSF2-B<base seed>-G<bonus counter>-S<skill counter> or GSF1 format.", "請輸入GSF2-B<基準seed>-G<復原計數器>-S<技能計數器>或GSF1格式的存檔狀態代碼。"],
  "状態コード内の基準seedが範囲外です。": ["The base seed in the state code is out of range.", "狀態代碼中的基準seed超出範圍。"],
  "状態コード内の復元ボーナスカウンターが範囲外です。": ["The Bonus Counter in the state code is out of range.", "狀態代碼中的復原加成計數器超出範圍。"],
  "状態コード内のスキルカウンターが範囲外です。": ["The Skill Counter in the state code is out of range.", "狀態代碼中的技能計數器超出範圍。"],
  "保存後の内部位置が対応範囲を超えました。": ["The post-save internal position exceeds the supported range.", "存檔後的內部位置超出支援範圍。"],
  "保存後のスキルカウンターが対応範囲を超えました。": ["The post-save Skill Counter exceeds the supported range.", "存檔後的技能計數器超出支援範圍。"],
  "基準seedまたはスキルカウンターが特定されていません。": ["The base seed or Skill Counter has not been identified.", "基準seed或技能計數器尚未確定。"],
  "抽選結果を1回以上入力してください。": ["Enter at least one roll result.", "請輸入至少1次抽選結果。"],
  "スキル再付与結果を1回以上入力してください。": ["Enter at least one Reset Skills result.", "請輸入至少1次技能重新附加結果。"],
  "内部位置の開始は終了以下にしてください。": ["The starting internal position must not exceed the ending position.", "內部位置的開始值不得大於結束值。"],
  "seed開始は終了以下にしてください。": ["The starting seed must not exceed the ending seed.", "seed開始值不得大於結束值。"],
  "スキル内部位置の開始は終了以下にしてください。": ["The starting Skill Counter candidate must not exceed the ending candidate.", "技能內部位置的開始值不得大於結束值。"],
  "表示する回数は1〜10,000の整数で入力してください。": ["Enter the number of rolls as an integer from 1 to 10,000.", "顯示次數請輸入1～10,000的整數。"],
  "比較表の表示回数は1〜10,000の整数で入力してください。": ["Enter the comparison row count as an integer from 1 to 10,000.", "比較表顯示次數請輸入1～10,000的整數。"],
  "スキルの表示回数は1〜10,000の整数で入力してください。": ["Enter the number of skill rolls as an integer from 1 to 10,000.", "技能顯示次數請輸入1～10,000的整數。"],
  "先に基準seedを検索するか、未来予測タブで基準seedを入力してください。": ["Search for the base seed first, or enter it in a Forecast tab.", "請先搜尋基準seed，或在未來預測分頁中輸入基準seed。"],
  "一致するスキルカウンターがありません。武器種・属性・入力順を確認し、必要なら探索範囲を広げてください。": ["No matching Skill Counter was found. Check the weapon type, element, and input order, then increase the range if needed.", "找不到符合的技能計數器。請確認武器種類、屬性與輸入順序，必要時擴大搜尋範圍。"],
  "観測したスキル結果と特定位置の先頭が一致しません。": ["The observed skill results do not match the start of the identified position.", "觀測到的技能結果與已確定位置的開頭不一致。"],
  "観測結果と予測の先頭が一致しません。武器種・属性・候補を確認してください。": ["The observed results do not match the start of the forecast. Check the weapon type, element, and candidate.", "觀測結果與預測開頭不一致。請確認武器種類、屬性與候選。"],
  "EX厳選する武器の現在5枠構成を入力してください。": ["Enter the current five-slot composition of the weapon being farmed for EX.", "請輸入要嚴選EX武器目前的5格組合。"],
  "指定した構成は表示範囲内にありません。表示回数を増やしてください。": ["The specified composition is not in the displayed range. Increase the number of rolls.", "指定組合不在顯示範圍內，請增加顯示次數。"],
  "指定したグループ・シリーズ条件に合う結果は表示範囲内にありません。表示回数を増やすか条件を変更してください。": ["No result in the displayed range matches the selected Group / Series conditions. Increase the number of rolls or change the conditions.", "顯示範圍內沒有符合指定團體／系列條件的結果。請增加顯示次數或更改條件。"],
  "CSVへ出力できる復元ボーナス未来予測の結果がありません。": ["There are no Bonus Forecast results available for CSV export.", "沒有可匯出CSV的復原加成未來預測結果。"],
  "CSVへ出力できるスキル未来予測の結果がありません。": ["There are no Skill Forecast results available for CSV export.", "沒有可匯出CSV的技能未來預測結果。"],
  "この武器種・属性は登録済みです。EX未厳選の別武器は「ボーナスを同じ構成で再復元」を選んでから登録してください。": ["This weapon type and element are already registered. To add another weapon awaiting EX farming, select Amend (Keep Bonuses) first.", "此武器種類與屬性已登錄。若要加入另一把尚未嚴選EX的武器，請先選擇「保留加成組合並再次復原強化」。"],
  "同じ表示名が登録済みです。別の名前を入力してください。": ["That display name is already registered. Enter a different name.", "此顯示名稱已登錄，請輸入其他名稱。"],
  "同じ武器種・属性の別武器には、区別できる表示名を入力してください。": ["Give separate weapons with the same type and element distinct display names.", "相同武器種類與屬性的不同武器，請輸入可區分的顯示名稱。"],
};

const ALL_TEXT = { ...OFFICIAL_TERMS, ...UI_TEXT };

const localeIndex = (locale) => (locale === "en" ? 0 : 1);

export function getLocale() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(stored)) return stored;
  } catch {
    // Keep the site usable when storage is unavailable.
  }
  return "ja";
}

export function t(source) {
  const locale = getLocale();
  if (locale === "ja" || typeof source !== "string") return source;
  const normalized = source.trim().replace(/\s+/g, " ");
  return ALL_TEXT[normalized]?.[localeIndex(locale)] ?? translateTemplate(normalized, locale, source);
}

export function formatNumber(value) {
  const locale = getLocale();
  const numberLocale = locale === "zh-Hant" ? "zh-TW" : locale === "en" ? "en-US" : "ja-JP";
  return Number(value).toLocaleString(numberLocale);
}

export function localizedTargetName(weaponName, attributeName) {
  const locale = getLocale();
  if (locale === "ja") {
    const attribute = attributeName === "無属性" ? attributeName : attributeName.replace("属性", "");
    return `${attribute}${weaponName}`;
  }
  if (locale === "en") return `${t(attributeName)} ${t(weaponName)}`;
  return `${t(attributeName)}${t(weaponName)}`;
}

function translateTemplate(source, locale, fallback = source) {
  const en = locale === "en";
  let match;
  if ((match = source.match(/^(\d+)枠目$/))) return en ? `Slot ${match[1]}` : `第${match[1]}格`;
  if ((match = source.match(/^抽選 (\d+)$/))) return en ? `Roll ${match[1]}` : `抽選 ${match[1]}`;
  if ((match = source.match(/^再付与 (\d+)$/))) return en ? `Reset ${match[1]}` : `重新附加 ${match[1]}`;
  if ((match = source.match(/^再付与(\d+)のシリーズスキル$/))) return en ? `Reset ${match[1]} Series Skill` : `第${match[1]}次重新附加的系列技能`;
  if ((match = source.match(/^再付与(\d+)のグループスキル$/))) return en ? `Reset ${match[1]} Group Skill` : `第${match[1]}次重新附加的團體技能`;
  if ((match = source.match(/^希望 (\d+)$/))) return en ? `Desired ${match[1]}` : `目標 ${match[1]}`;
  if ((match = source.match(/^(\d+)回先$/))) return en ? `${match[1]} rolls ahead` : `${match[1]}次後`;
  if ((match = source.match(/^(\d+)候補$/))) return en ? `${match[1]} candidates` : `${match[1]}個候選`;
  if ((match = source.match(/^(\d+)回を表示$/))) return en ? `Showing ${match[1]} rolls` : `顯示${match[1]}次`;
  if ((match = source.match(/^(\d+)回中 (\d+)回一致$/))) return en ? `${match[2]} of ${match[1]} rolls match` : `${match[1]}次中有${match[2]}次符合`;
  if ((match = source.match(/^([\d,]+)行・([\d,]+)列をCSVへ出力しました。$/))) return en ? `Exported ${match[1]} rows and ${match[2]} columns to CSV.` : `已將${match[1]}列、${match[2]}欄匯出為CSV。`;
  if ((match = source.match(/^([\d.]+)秒$/))) return en ? `${match[1]} sec` : `${match[1]}秒`;
  if ((match = source.match(/^復元([\d,]+)$/))) return en ? `Bonus ${match[1]}` : `復原 ${match[1]}`;
  if ((match = source.match(/^スキル([\d,]+)$/))) return en ? `Skill ${match[1]}` : `技能 ${match[1]}`;
  if ((match = source.match(/^現在表示中の([\d,]+)行をCSVへ出力します。$/))) return en ? `Export the ${match[1]} visible rows to CSV.` : `將目前顯示的${match[1]}列匯出為CSV。`;
  if ((match = source.match(/^EX条件一致で現在表示中の([\d,]+)行をCSVへ出力します。$/))) return en ? `Export the ${match[1]} visible EX-matching rows to CSV.` : `將目前顯示且符合EX條件的${match[1]}列匯出為CSV。`;
  if ((match = source.match(/^条件一致で現在表示中の([\d,]+)行をCSVへ出力します。$/))) return en ? `Export the ${match[1]} visible matching rows to CSV.` : `將目前顯示且符合條件的${match[1]}列匯出為CSV。`;
  if ((match = source.match(/^([\d,]+)条件 × ([\d,]+)回$/))) return en ? `${match[1]} target × ${match[2]} rolls` : `${match[1]}個條件 × ${match[2]}次`;
  if ((match = source.match(/^([\d,]+)武器 × ([\d,]+)回$/))) return en ? `${match[1]} weapons × ${match[2]} rolls` : `${match[1]}把武器 × ${match[2]}次`;
  if ((match = source.match(/^抽選(\d+)の(\d+)枠目を選択してください。$/))) return en ? `Select slot ${match[2]} for roll ${match[1]}.` : `請選擇抽選${match[1]}的第${match[2]}格。`;
  if ((match = source.match(/^再付与(\d+)のシリーズとグループを選択してください。$/))) return en ? `Select the Series and Group Skills for reset ${match[1]}.` : `請選擇第${match[1]}次重新附加的系列與團體技能。`;
  if ((match = source.match(/^(.+)は([\d,]+)〜([\d,]+)の整数で入力してください。$/))) return en ? `Enter ${t(match[1])} as an integer from ${match[2]} to ${match[3]}.` : `${t(match[1])}請輸入${match[2]}～${match[3]}的整數。`;
  if ((match = source.match(/^(\d+)件の武器に未選択の枠があります。各武器の5枠をすべて選択してください。$/))) return en ? `${match[1]} weapon(s) have unselected slots. Select all five slots for every weapon.` : `有${match[1]}把武器尚有未選擇的格位。請為每把武器選擇全部5格。`;
  if ((match = source.match(/^(\d+)\/(\d+) 構成入力済み$/))) return en ? `${match[1]}/${match[2]} compositions entered` : `已輸入 ${match[1]}/${match[2]} 組合`;
  if ((match = source.match(/^スキルカウンター ([\d,]+) を特定$/))) return en ? `Skill Counter ${match[1]} identified` : `已確定技能計數器 ${match[1]}`;
  if ((match = source.match(/^セーブ状態コードをコピー: (.+)$/))) return en ? `Copy save-state code: ${match[1]}` : `複製存檔狀態代碼：${match[1]}`;
  if ((match = source.match(/^(.+)を比較対象から削除$/))) return en ? `Remove ${match[1]} from comparison` : `從比較目標中移除${match[1]}`;
  if ((match = source.match(/^現在の探索範囲: ([\d,]+)〜([\d,]+)（([\d,]+)候補）。(.+)$/))) {
    const suffixMap = {
      "狭い探索範囲です。推定値に自信がある場合に使用してください。": en ? "This is a narrow range; use it when your estimate is reliable." : "搜尋範圍較窄，請在推測值可靠時使用。",
      "端末によっては数分かかります。": en ? "This may take several minutes on some devices." : "視裝置而定，可能需要數分鐘。",
      "候補数が多いため長時間かかります。": en ? "The large candidate count may take a long time." : "候選數量較多，可能需要較長時間。",
      "非常に長時間かかります。可能なら推定値を見直して範囲を分割してください。": en ? "This will take a very long time. If possible, revise the estimate and split the range." : "這會耗費非常長的時間。若可行，請重新估算並分割範圍。",
      "非常に長時間かかります。端末やブラウザによっては完了が難しい場合があります。": en ? "This will take a very long time and may not finish on some devices or browsers." : "這會耗費非常長的時間，部分裝置或瀏覽器可能無法完成。",
    };
    const suffix = suffixMap[match[4]] ?? match[4];
    return en
      ? `Current range: ${match[1]}–${match[2]} (${match[3]} candidates). ${suffix}`
      : `目前搜尋範圍：${match[1]}～${match[2]}（${match[3]}個候選）。${suffix}`;
  }
  if ((match = source.match(/^(\d+)\/3 特定済み$/))) return en ? `${match[1]}/3 identified` : `已確定 ${match[1]}/3`;
  if (source === "3値を特定済み") return en ? "All 3 values identified" : "3個數值皆已確定";
  return fallback;
}

function translatedNodeValue(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) return rawValue;
  const translated = t(trimmed);
  if (translated === trimmed) return rawValue;
  const start = rawValue.indexOf(trimmed);
  return `${rawValue.slice(0, start)}${translated}${rawValue.slice(start + trimmed.length)}`;
}

function translateNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement;
    if (!parent || parent.closest("script, style")) return;
    node.nodeValue = translatedNodeValue(node.nodeValue);
    return;
  }
  if (!(node instanceof Element)) return;
  for (const attribute of ["placeholder", "aria-label", "title"]) {
    if (node.hasAttribute(attribute)) node.setAttribute(attribute, t(node.getAttribute(attribute)));
  }
  for (const child of node.childNodes) translateNode(child);
}

function initializeLanguageSelector() {
  const selector = document.querySelector("#language-select");
  if (!selector) return;
  selector.value = getLocale();
  selector.addEventListener("change", () => {
    if (!SUPPORTED_LANGUAGES.includes(selector.value)) return;
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, selector.value);
    } catch {
      // Reload still applies Japanese when storage is unavailable.
    }
    window.location.reload();
  });
}

function initializeI18n() {
  const locale = getLocale();
  document.documentElement.lang = locale;
  initializeLanguageSelector();
  if (locale === "ja") return;
  translateNode(document.body);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) translateNode(node);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

initializeI18n();
