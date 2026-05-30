/* ==========================================================================
   🦑 BUKICHI HIGH! (ブキチハイ！) - JAVASCRIPT LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- 💻 DOM Elements ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const playerListContainer = document.getElementById('player-list');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const bufferSlider = document.getElementById('buffer-count');
    const bufferValBadge = document.getElementById('buffer-val');
    const drawRuleCheckbox = document.getElementById('draw-rule');
    const drawStageCheckbox = document.getElementById('draw-stage');
    const russianWeaponRouletteCheckbox = document.getElementById('russian-weapon-roulette');
    const russianWeaponProbabilitySelect = document.getElementById('russian-weapon-probability');
    const russianWeaponProbabilityGroup = document.getElementById('russian-weapon-probability-group');
    const russianRuleRouletteCheckbox = document.getElementById('russian-rule-roulette');
    const russianRuleProbabilitySelect = document.getElementById('russian-rule-probability');
    const russianRuleProbabilityGroup = document.getElementById('russian-rule-probability-group');
    const drawSpecialRuleCheckbox = document.getElementById('draw-special-rule');
    const specialRuleProbabilitySelect = document.getElementById('special-rule-probability');
    const specialRuleProbabilityGroup = document.getElementById('special-rule-probability-group');
    const specialRuleInfoBlock = document.getElementById('special-rule-info');
    const resultSpecialRuleSpan = document.getElementById('result-special-rule');
    const resultProbabilityValue = document.getElementById('result-probability-value');
    const resultProbabilityComment = document.getElementById('result-probability-comment');
    const newRuleInput = document.getElementById('new-rule-input');
    const addRuleBtn = document.getElementById('add-rule-btn');
    const specialRulesListContainer = document.getElementById('special-rules-list');
    const rollBtn = document.getElementById('roll-btn');
    
    const resultsPlaceholder = document.getElementById('results-placeholder');
    const resultsContainer = document.getElementById('results-container');
    const resultRule = document.getElementById('result-rule');
    const resultStage = document.getElementById('result-stage');
    const playerWeaponsGrid = document.getElementById('player-weapons-grid');
    const bufferWeaponsCard = document.getElementById('buffer-weapons-card');
    const bufferWeaponsGrid = document.getElementById('buffer-weapons-grid');
    const copyTextarea = document.getElementById('copy-textarea');
    const copyBtn = document.getElementById('copy-btn');
    const discordWebhookInput = document.getElementById('discord-webhook-url');
    const discordSendBtn = document.getElementById('discord-send-btn');
    const rollAgainBtn = document.getElementById('roll-again-btn');

    // --- 📊 State & Global Variables ---
    let weaponList = []; // weapons.csv から読み込むデータ
    let initialSpecialRules = []; // special_rules.csv から読み込む初期データ
    let customSpecialRules = []; // localStorage から読み込むユーザーデータ
    let activeSpecialRules = []; // 抽選に使用するアクティブな特殊ルールリスト
    let disabledSpecialRules = []; // 無効化された特殊ルールのリスト
    
    // スプラトゥーン3のステージリスト（全24ステージ）
    const stageList = [
        'ユノハナ大渓谷', 'ゴンズイ地区', 'ヤガラ市場', 'マテガイ放水路',
        'ナメロウ金属', 'スメーシーワールド', 'マサバ海峡大橋', 'キンメダイ美術館',
        'マヒマヒリゾート＆スパ', 'チョウザメ造船', '海女美術大学', 'ザトウマーケット',
        'クサヤ温泉', 'ヒラメが丘団地', 'タラポートショッピングパーク', 'コンブトラック',
        'デカライン高架下', 'オヒョウ海運', 'バイガイ亭', 'ナンプラー遺跡',
        'ネギトロ炭鉱', 'カジキ空港', 'リュウグウターミナル', 'タカアシ経済特区'
    ];

    // ルールリスト
    const ruleList = [
        'ナワバリバトル',
        'ガチエリア',
        'ガチヤグラ',
        'ガチホコバトル',
        'ガチアサリ'
    ];

    // --- ☀️/🌙 1. Theme Toggle System (LocalStorage-persistent) ---
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    };

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // --- 📥 2. CSV Loader & Parser ---
    const loadWeaponsCSV = async () => {
        try {
            const response = await fetch('weapons.csv');
            if (!response.ok) throw new Error('ブキデータのCSVファイルが読み込めませんでした。');
            
            const text = await response.text();
            // 改行で分割し、空行を除外
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            
            // ヘッダー行 (カテゴリー,ブキ名) を除いたデータ行をパース
            const parsedWeapons = [];
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',');
                if (parts.length >= 2) {
                    parsedWeapons.push({
                        category: parts[0].trim(),
                        name: parts[1].trim()
                    });
                }
            }
            
            weaponList = parsedWeapons;
            console.log(`Loaded ${weaponList.length} weapons successfully.`);
        } catch (error) {
            console.error('CSV Load Error:', error);
            // CSVロード失敗時のフォールバックデータ
            weaponList = [
                { category: 'シューター', name: 'わかばシューター' },
                { category: 'シューター', name: 'スプラシューター' },
                { category: 'ローラー', name: 'スプラローラー' },
                { category: 'チャージャー', name: 'スプラチャージャー' },
                { category: 'フデ', name: 'パブロ' },
                { category: 'マニューバー', name: 'スプラマニューバー' }
            ];
        }
    };

    // --- 📥 2.1 Special Rules Loader, Render & Storage System ---
    const loadSpecialRules = async () => {
        try {
            // 1. CSV から初期特殊ルールを読み込む
            const response = await fetch('special_rules.csv');
            if (response.ok) {
                const text = await response.text();
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                
                const parsedRules = [];
                for (let i = 1; i < lines.length; i++) {
                    const ruleName = lines[i].trim();
                    if (ruleName !== '') {
                        parsedRules.push(ruleName);
                    }
                }
                initialSpecialRules = parsedRules;
            }
        } catch (error) {
            console.error('Special rules CSV Load Error:', error);
            initialSpecialRules = ['サブウェポン使用禁止', 'スペシャルウェポン使用禁止'];
        }

        // 2. localStorage からユーザーカスタムルールを読み込む
        try {
            const savedCustom = localStorage.getItem('custom_special_rules');
            if (savedCustom) {
                customSpecialRules = JSON.parse(savedCustom);
            }
        } catch (error) {
            console.error('LocalStorage load error:', error);
            customSpecialRules = [];
        }

        // 2.5 localStorage から無効化（除外）された特殊ルールを読み込む
        try {
            const savedDisabled = localStorage.getItem('disabled_special_rules');
            if (savedDisabled) {
                disabledSpecialRules = JSON.parse(savedDisabled);
            }
        } catch (error) {
            console.error('LocalStorage disabled rules load error:', error);
            disabledSpecialRules = [];
        }

        // 3. 総アクティブリストを構築してUIに描画
        updateActiveSpecialRules();
    };

    const updateActiveSpecialRules = () => {
        activeSpecialRules = [...initialSpecialRules, ...customSpecialRules];
        renderSpecialRulesList();
    };

    // UIへルール一覧を描画する
    const renderSpecialRulesList = () => {
        specialRulesListContainer.innerHTML = '';

        // 初期CSVルールを描画（チェックボックス付き、削除不可）
        initialSpecialRules.forEach(rule => {
            const li = document.createElement('li');
            const isDisabled = disabledSpecialRules.includes(rule);
            li.className = `rule-list-item${isDisabled ? ' rule-disabled' : ''}`;
            li.innerHTML = `
                <label class="rule-checkbox-container">
                    <input type="checkbox" class="rule-check-input" data-rule="${escapeHTML(rule)}" ${isDisabled ? '' : 'checked'}>
                    <span>${escapeHTML(rule)} <small style="font-size:0.7rem; color:var(--text-muted);">(初期)</small></span>
                </label>
                <span style="font-size:0.75rem; color:var(--text-muted);">🔒</span>
            `;
            
            li.querySelector('.rule-check-input').addEventListener('change', handleRuleToggle);
            specialRulesListContainer.appendChild(li);
        });

        // ユーザーカスタムルールを描画（チェックボックス＋削除ボタン付き）
        customSpecialRules.forEach((rule, index) => {
            const li = document.createElement('li');
            const isDisabled = disabledSpecialRules.includes(rule);
            li.className = `rule-list-item${isDisabled ? ' rule-disabled' : ''}`;
            li.innerHTML = `
                <label class="rule-checkbox-container">
                    <input type="checkbox" class="rule-check-input" data-rule="${escapeHTML(rule)}" ${isDisabled ? '' : 'checked'}>
                    <span>${escapeHTML(rule)}</span>
                </label>
                <button type="button" class="btn-delete-rule" data-index="${index}" aria-label="削除">
                    ❌
                </button>
            `;
            
            li.querySelector('.rule-check-input').addEventListener('change', handleRuleToggle);
            
            li.querySelector('.btn-delete-rule').addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
                deleteCustomSpecialRule(idx);
            });

            specialRulesListContainer.appendChild(li);
        });
    };

    // 有効/無効トグルイベントハンドラー
    const handleRuleToggle = (e) => {
        const ruleName = e.target.getAttribute('data-rule');
        const isChecked = e.target.checked;
        const listItem = e.target.closest('.rule-list-item');

        if (isChecked) {
            // 有効化された場合: 無効リストから除外
            disabledSpecialRules = disabledSpecialRules.filter(r => r !== ruleName);
            if (listItem) listItem.classList.remove('rule-disabled');
        } else {
            // 無効化された場合: 無効リストに追加
            if (!disabledSpecialRules.includes(ruleName)) {
                disabledSpecialRules.push(ruleName);
            }
            if (listItem) listItem.classList.add('rule-disabled');
        }

        localStorage.setItem('disabled_special_rules', JSON.stringify(disabledSpecialRules));
    };

    // ルールの新規追加
    const addCustomSpecialRule = () => {
        const val = newRuleInput.value.trim();
        if (val === '') return;

        // 重複チェック
        if (activeSpecialRules.includes(val)) {
            alert('すでに存在する特殊ルールです。');
            return;
        }

        customSpecialRules.push(val);
        localStorage.setItem('custom_special_rules', JSON.stringify(customSpecialRules));
        
        newRuleInput.value = '';
        updateActiveSpecialRules();
        
        // スクロールを下部へ
        specialRulesListContainer.scrollTop = specialRulesListContainer.scrollHeight;
    };

    // ルールの削除
    const deleteCustomSpecialRule = (index) => {
        const ruleName = customSpecialRules[index];
        // 無効化リストからも除去
        disabledSpecialRules = disabledSpecialRules.filter(r => r !== ruleName);
        localStorage.setItem('disabled_special_rules', JSON.stringify(disabledSpecialRules));

        customSpecialRules.splice(index, 1);
        localStorage.setItem('custom_special_rules', JSON.stringify(customSpecialRules));
        updateActiveSpecialRules();
    };

    // ➕ボタンとEnterキーでのルール追加イベント
    addRuleBtn.addEventListener('click', addCustomSpecialRule);
    newRuleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomSpecialRule();
        }
    });

    // ロシアンルーレットトグルの表示連動
    russianWeaponRouletteCheckbox.addEventListener('change', () => {
        if (russianWeaponRouletteCheckbox.checked) {
            russianWeaponProbabilityGroup.classList.remove('hidden');
        } else {
            russianWeaponProbabilityGroup.classList.add('hidden');
        }
    });

    russianRuleRouletteCheckbox.addEventListener('change', () => {
        if (russianRuleRouletteCheckbox.checked) {
            russianRuleProbabilityGroup.classList.remove('hidden');
        } else {
            russianRuleProbabilityGroup.classList.add('hidden');
        }
    });

    drawSpecialRuleCheckbox.addEventListener('change', () => {
        if (drawSpecialRuleCheckbox.checked) {
            specialRuleProbabilityGroup.classList.remove('hidden');
        } else {
            specialRuleProbabilityGroup.classList.add('hidden');
        }
    });

    // --- 👥 3. Dynamic Player Management ---
    let playerCounter = 0;

    // プレイヤーが最大10人に達したかどうかを判定し、ボタンの活性状態を切り替える親切ロジック
    const checkPlayerLimit = () => {
        const count = playerListContainer.querySelectorAll('.player-row').length;
        if (count >= 10) {
            addPlayerBtn.disabled = true;
            addPlayerBtn.style.opacity = '0.5';
            addPlayerBtn.style.cursor = 'not-allowed';
            addPlayerBtn.title = 'プレイヤーは最大10人までです';
        } else {
            addPlayerBtn.disabled = false;
            addPlayerBtn.style.opacity = '1';
            addPlayerBtn.style.cursor = 'pointer';
            addPlayerBtn.title = '';
        }
    };

    const createPlayerInput = (defaultName = '') => {
        // すでに10名の場合は追加を拒否
        const currentCount = playerListContainer.querySelectorAll('.player-row').length;
        if (currentCount >= 10) return;

        playerCounter++;
        const row = document.createElement('div');
        row.className = 'player-row';
        row.id = `player-row-${playerCounter}`;
        
        row.innerHTML = `
            <input type="text" class="input-player" placeholder="プレイヤー ${playerCounter}" value="${defaultName}">
            <button type="button" class="btn-delete" aria-label="削除">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        
        // 削除ボタンのイベント
        row.querySelector('.btn-delete').addEventListener('click', () => {
            row.style.animation = 'slideOut 0.2s cubic-bezier(0.4, 0, 1, 1) forwards';
            setTimeout(() => {
                row.remove();
                updatePlaceholderNumbers();
                checkPlayerLimit(); // 削除後にリミットを再判定してボタンを有効化します
            }, 200);
        });

        playerListContainer.appendChild(row);
        checkPlayerLimit(); // 追加後にリミットを判定してボタンを無効化します
    };

    // 削除時にプレースホルダーの「プレイヤー N」番号を振り直す処理
    const updatePlaceholderNumbers = () => {
        const rows = playerListContainer.querySelectorAll('.player-row');
        rows.forEach((row, index) => {
            const input = row.querySelector('.input-player');
            input.placeholder = `プレイヤー ${index + 1}`;
        });
    };

    // 初期表示として8人の入力欄を自動生成（プラベ標準人数でし！）
    const setupInitialPlayers = () => {
        for (let i = 0; i < 8; i++) {
            createPlayerInput();
        }
    };

    addPlayerBtn.addEventListener('click', () => {
        createPlayerInput();
        // スクロールを下部へ自動調整
        playerListContainer.scrollTop = playerListContainer.scrollHeight;
    });

    // --- 🎚️ 4. Option Handlers ---
    // バッファ数のスライダー数値連動
    bufferSlider.addEventListener('input', (e) => {
        bufferValBadge.textContent = e.target.value;
    });

    // --- 🎲 5. Fisher-Yates Shuffle & Selection Engine ---
    const shuffleArray = (array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    // --- 🔫 6. Main Roulette Roll Execution ---
    const rollRoulette = () => {
        // 1. プレイヤーリストの収集（名前が入力されているプレイヤーのみを対象とする）
        const playerRows = playerListContainer.querySelectorAll('.player-row');
        const players = [];
        playerRows.forEach((row) => {
            const val = row.querySelector('.input-player').value.trim();
            if (val !== '') {
                players.push(val);
            }
        });

        if (players.length === 0) {
            alert('ナカマの名前を1人以上入力するでし！');
            return;
        }

        // 2. バッファ数取得
        const bufferCount = parseInt(bufferSlider.value, 10);
        const totalWeaponDrawNeed = players.length + bufferCount;

        // 3. ブキプールからの重複あり完全ランダム抽選（全員同じブキの可能性ありでし！）
        let selectedWeapons = [];
        if (weaponList.length === 0) {
            alert('ブキデータが存在しません。CSVファイルのロード状況を確認してください。');
            return;
        }

        for (let i = 0; i < totalWeaponDrawNeed; i++) {
            const randomIndex = Math.floor(Math.random() * weaponList.length);
            selectedWeapons.push({ ...weaponList[randomIndex] });
        }

        // 4. プレイヤーへの割り当て ＆ バッファの分類
        const playerAssignments = [];
        const isRussianWeaponMode = russianWeaponRouletteCheckbox.checked;
        const isRussianRuleMode = russianRuleRouletteCheckbox.checked;
        const weaponProbability = parseFloat(russianWeaponProbabilitySelect.value); // 全体の指定ブキ確率を取得
        const ruleProbability = parseFloat(russianRuleProbabilitySelect.value); // ルール指定確率を取得

        // ロシアンブキの当選者を事前に決定する（最大1名）
        let russianTargetIndex = -1;
        if (isRussianWeaponMode && players.length > 1 && Math.random() < weaponProbability) {
            russianTargetIndex = Math.floor(Math.random() * players.length);
        }

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            let weapon = selectedWeapons[i];
            let isRussianWeapon = false;

            // 当選したプレイヤーのみ指定ブキにするでし！
            if (i === russianTargetIndex) {
                // 自分以外のプレイヤーからランダムに1人選ぶ
                const candidates = players.filter(p => p !== player);
                const nominator = candidates[Math.floor(Math.random() * candidates.length)];
                weapon = {
                    name: `${nominator}さんが指定してください`,
                    category: '指定',
                    nominator: nominator
                };
                isRussianWeapon = true;
            }

            playerAssignments.push({
                player: player,
                weapon: weapon,
                isRussian: isRussianWeapon
            });
        }

        const bufferWeapons = selectedWeapons.slice(players.length);

        // 5. ルール・ステージ抽選
        let drawnRule = '（抽選なし）';
        let drawnStage = '（抽選なし）';
        let drawnSpecialRule = '';

        if (drawRuleCheckbox.checked) {
            // ルールロシアンルーレットモードかつ、プレイヤーが1人以上存在する場合に確率で指定ルールに
            if (isRussianRuleMode && players.length > 0 && Math.random() < ruleProbability) {
                const nominator = players[Math.floor(Math.random() * players.length)];
                drawnRule = `${nominator}さんが指定してください`;
            } else {
                drawnRule = ruleList[Math.floor(Math.random() * ruleList.length)];
            }
        }
        if (drawStageCheckbox.checked) {
            drawnStage = stageList[Math.floor(Math.random() * stageList.length)];
        }

        // 5.1 特殊ルールのランダム抽選 (プランB: 無効化されたものを除外したリストから確率で抽選します)
        if (drawSpecialRuleCheckbox.checked && activeSpecialRules.length > 0) {
            const specialRuleProb = parseFloat(specialRuleProbabilitySelect.value);
            if (Math.random() < specialRuleProb) {
                const enabledRules = activeSpecialRules.filter(rule => !disabledSpecialRules.includes(rule));
                if (enabledRules.length > 0) {
                    let ruleCandidate = enabledRules[Math.floor(Math.random() * enabledRules.length)];
                    
                    // ◯◯ が含まれている場合、プレイヤーからランダムに選んで置き換えます
                    if (ruleCandidate.includes('◯◯')) {
                        const nominator = players[Math.floor(Math.random() * players.length)];
                        drawnSpecialRule = ruleCandidate.replace('◯◯', nominator);
                    } else {
                        drawnSpecialRule = ruleCandidate;
                    }
                } else {
                    drawnSpecialRule = '（有効な特殊ルールがありません）';
                }
            } else {
                drawnSpecialRule = ''; // 確率により発生せず
            }
        }

        // 6. UIへの描画
        displayResults(drawnRule, drawnStage, drawnSpecialRule, playerAssignments, bufferWeapons);
    };

    // --- 🎲 6.5 Calculate Selection Probability ---
    const calculateProbability = (rule, stage, specialRule, playerAssignments, bufferWeapons) => {
        let p = 1.0;

        // 1. ルールの抽選確率
        if (drawRuleCheckbox.checked) {
            const isRussianRule = rule.includes('さんが指定');
            const ruleProb = parseFloat(russianRuleProbabilitySelect.value);
            const playerCount = playerAssignments.length;
            if (isRussianRule) {
                // 指定ルール： 指定確率 × (1 / 人数)
                p *= ruleProb * (1.0 / playerCount);
            } else {
                // 通常ルール： (1 - 指定確率) × (1 / 全5種)
                p *= (1.0 - ruleProb) * (1.0 / ruleList.length);
            }
        }

        // 2. ステージの抽選確率
        if (drawStageCheckbox.checked) {
            p *= (1.0 / stageList.length); // 1 / 24
        }

        // 3. 特殊ルールの抽選確率
        let isUnifiedSpecialRule = false;
        if (drawSpecialRuleCheckbox.checked) {
            const specialRuleProb = parseFloat(specialRuleProbabilitySelect.value);
            if (specialRule) {
                const enabledRules = activeSpecialRules.filter(r => !disabledSpecialRules.includes(r));
                const sCount = enabledRules.length;
                if (sCount > 0) {
                    let ruleP = specialRuleProb * (1.0 / sCount);
                    
                    // 〇〇さんが指定などの置換ルールの場合、プレイヤー指定の 1 / N が掛かる
                    const match = specialRule.match(/^(ブキ|サブ|スペシャル)統一\((.+)さんが指定\)$/);
                    const playerCount = playerAssignments.length;
                    if (match) {
                        ruleP *= (1.0 / playerCount);
                        isUnifiedSpecialRule = true; // 統一ルール発生時は、通常ブキ確率は除外する
                    } else if (specialRule.includes('指定')) {
                        ruleP *= (1.0 / playerCount);
                    }
                    p *= ruleP;
                }
            } else {
                // 特殊ルール非発生時
                p *= (1.0 - specialRuleProb);
            }
        }

        // 4. ブキの抽選確率
        if (!isUnifiedSpecialRule && weaponList.length > 0) {
            const weaponProb = parseFloat(russianWeaponProbabilitySelect.value); // ロシアン発生確率
            const playerCount = playerAssignments.length;
            const wPoolSize = weaponList.length;

            const hasRussian = playerAssignments.some(assign => assign.isRussian);

            if (hasRussian) {
                // ロシアンが1名発生した場合の確率：
                // ロシアン確率 × (1 / 人数 [対象者選定]) × (1 / (人数-1) [指定役選定])
                p *= weaponProb * (1.0 / playerCount) * (1.0 / (playerCount - 1));
                // 残りの通常ブキ (人数 - 1) 個の確率
                p *= Math.pow(1.0 / wPoolSize, playerCount - 1);
            } else {
                // ロシアンが発生しなかった場合の確率：
                // (1 - ロシアン確率) × (1 / ブキプール総数)^人数
                p *= (1.0 - weaponProb) * Math.pow(1.0 / wPoolSize, playerCount);
            }

            // バッファ武器の確率
            bufferWeapons.forEach(() => {
                p *= (1.0 / wPoolSize);
            });
        }

        return p;
    };

    // 確率に基づくブキチの面白コメントを生成する関数
    const getBukichiComment = (prob) => {
        if (prob >= 1.0) {
            return 'これしかない組み合わせでし！運命でし！';
        }
        
        const inverse = 1.0 / prob;
        if (inverse <= 100) {
            return 'まあまあよくある組み合わせでし！お気軽に楽しんでほしいでし！';
        } else if (inverse <= 10000) {
            return 'そこそこ珍しい組み合わせでし！ちょっとした刺激を楽しむでし！';
        } else if (inverse <= 1000000) {
            return 'かなりレアな対戦カードでし！このチャンスを逃さず勝利をつかむでし！';
        } else {
            return '天文学的な超ウルトラ激レア引きでし！！歴史に残るプラベになりそうでし！！！';
        }
    };

    // --- 📺 7. Display Results in UI ---
    const displayResults = (rule, stage, specialRule, playerAssignments, bufferWeapons) => {
        // プレースホルダーを隠し、結果枠を表示
        resultsPlaceholder.classList.add('hidden');
        resultsContainer.classList.remove('hidden');

        // 確率計算とUI表示（ご主人様公認ハイブリッド設計でし！）
        const prob = calculateProbability(rule, stage, specialRule, playerAssignments, bufferWeapons);
        if (prob >= 1.0) {
            resultProbabilityValue.textContent = '100%';
            resultProbabilityComment.textContent = getBukichiComment(prob);
        } else {
            const inverse = Math.round(1.0 / prob);
            const percentStr = (prob * 100).toFixed(8).replace(/\.?0+$/, '');
            resultProbabilityValue.textContent = `1 / ${inverse.toLocaleString()} (${percentStr}%)`;
            resultProbabilityComment.textContent = getBukichiComment(prob);
        }

        // ルール＆ステージ
        if (rule.includes('さんが指定してください')) {
            resultRule.innerHTML = `<strong>${escapeHTML(rule)}</strong>`;
            resultRule.className = 'value text-danger';
        } else {
            resultRule.textContent = rule;
            resultRule.className = 'value';
        }
        resultStage.textContent = stage;

        // 特殊ルールの表示（特殊ルール発生！の警告表示を差し込みます）
        if (drawSpecialRuleCheckbox.checked && specialRule) {
            specialRuleInfoBlock.classList.remove('hidden');
            resultSpecialRuleSpan.innerHTML = `<span style="color:#ff453a; font-weight:900; font-size:1.1rem; text-shadow: 0 0 8px rgba(255, 69, 58, 0.4);">特殊ルール発生！</span><br><strong style="font-size:1.2rem; color:var(--text-primary); margin-top:0.4rem; display:inline-block;">${escapeHTML(specialRule)}</strong>`;
        } else {
            specialRuleInfoBlock.classList.add('hidden');
        }

        // 統一系特殊ルール（〇〇さんが指定）のパースと判定
        let isUnifiedRule = false;
        let unifiedType = '';
        let unifiedNominator = '';
        let unifiedInstruction = '';
        let copyInstruction = '';

        if (drawSpecialRuleCheckbox.checked && specialRule) {
            const match = specialRule.match(/^(ブキ|サブ|スペシャル)統一\((.+)さんが指定\)$/);
            if (match) {
                isUnifiedRule = true;
                unifiedType = match[1];
                unifiedNominator = match[2];
                
                if (unifiedType === 'ブキ') {
                    unifiedInstruction = `<strong>${escapeHTML(unifiedNominator)}さん</strong>はお好きな<strong>ブキ</strong>を指定してくださいでし！<br>プレイヤーは選ばれたブキを持ってバトルに挑んでくださいでし！`;
                    copyInstruction = `**${unifiedNominator}**さんはお好きな**ブキ**を指定してください。\nプレイヤーは選ばれたブキを持ってバトルに挑んでください！`;
                } else {
                    unifiedInstruction = `<strong>${escapeHTML(unifiedNominator)}さん</strong>はお好きな<strong>${escapeHTML(unifiedType)}</strong>を指定してくださいでし！<br>プレイヤーは選ばれた${escapeHTML(unifiedType)}を持ったブキから好きな物を選んでくださいでし！`;
                    copyInstruction = `**${unifiedNominator}**さんはお好きな**${unifiedType}**を指定してください。\nプレイヤーは選ばれた**${unifiedType}**を持ったブキから好きな物を選んでください！`;
                }
            }
        }

        // プレイヤー結果の表示（統一ルール時は特別指令カードを描画）
        if (playerWeaponsGrid) {
            playerWeaponsGrid.innerHTML = '';
            if (isUnifiedRule) {
                const card = document.createElement('div');
                card.className = 'unified-rule-card';
                card.style.gridColumn = '1 / -1'; // グリッド全体に広げる
                card.innerHTML = `
                    <div class="unified-title">📢 特別指令！</div>
                    <div class="unified-desc">${unifiedInstruction}</div>
                `;
                playerWeaponsGrid.appendChild(card);
            } else {
                playerAssignments.forEach(assign => {
                    const item = document.createElement('div');
                    item.className = `player-result-row${assign.isRussian ? ' russian-active' : ''}`;
                    
                    const displayWeaponName = assign.isRussian ? `<strong>${escapeHTML(assign.weapon.nominator)}</strong>さんが指定してください` : escapeHTML(assign.weapon.name);
                    item.innerHTML = `
                        <span class="player-name">${escapeHTML(assign.player)}</span>
                        <span class="weapon-name${assign.isRussian ? ' russian-text' : ''}">
                            ${displayWeaponName}
                            <span class="weapon-cat">${escapeHTML(assign.weapon.category)}</span>
                        </span>
                    `;
                    playerWeaponsGrid.appendChild(item);
                });
            }
        }

        // バッファ結果の生成（統一ルールの時はバッファを隠す）
        if (bufferWeapons.length > 0 && !isUnifiedRule) {
            if (bufferWeaponsCard) bufferWeaponsCard.classList.remove('hidden');
            if (bufferWeaponsGrid) {
                bufferWeaponsGrid.innerHTML = '';
                bufferWeapons.forEach(weapon => {
                    const badge = document.createElement('div');
                    badge.className = 'buffer-item';
                    badge.innerHTML = `
                        <span>${escapeHTML(weapon.name)}</span>
                        <span class="weapon-cat">${escapeHTML(weapon.category)}</span>
                    `;
                    bufferWeaponsGrid.appendChild(badge);
                });
            }
        } else {
            if (bufferWeaponsCard) bufferWeaponsCard.classList.add('hidden');
        }

        // 8. コピペ用テキストの自動生成（絵文字付き、美しい構造化、改行＆太字アジャスト！）
        let probSuffix = '';
        if (prob < 1.0) {
            const inverse = Math.round(1.0 / prob);
            probSuffix = ` (確率: 1 / ${inverse.toLocaleString()})`;
        }
        
        let copyText = `ブキチハイ！ 抽選結果でし！${probSuffix}\n\n`;
        copyText += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        // ルール・ステージセクション
        if (drawRuleCheckbox.checked || drawStageCheckbox.checked) {
            copyText += `**【ルール＆ステージ】**\n`;
            if (drawRuleCheckbox.checked) {
                if (rule.includes('さんが指定してください')) {
                    const nominator = rule.replace('さんが指定してください', '');
                    copyText += `ルール: **${nominator}**さんが指定してください\n`;
                } else {
                    copyText += `ルール: **${rule}**\n`;
                }
            }
            if (drawStageCheckbox.checked) {
                copyText += `ステージ: **${stage}**\n`;
            }
            copyText += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        }

        // 特殊ルールセクション
        if (drawSpecialRuleCheckbox.checked && specialRule) {
            copyText += `**【特別指令：特殊ルール】**\n`;
            copyText += `__**特殊ルール発生！: ${specialRule}**__\n\n`;
            if (isUnifiedRule) {
                copyText += `${copyInstruction}\n`;
            }
            copyText += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        }

        // プレイヤー＆バッファセクション（統一ルール時は個別ブキとバッファを省略）
        if (!isUnifiedRule) {
            copyText += `**【ブキ割り当てリスト】**\n`;
            playerAssignments.forEach(assign => {
                if (assign.isRussian) {
                    copyText += `${assign.player}: **${assign.weapon.nominator}**さんが指定してください\n`;
                } else {
                    copyText += `${assign.player}: ${assign.weapon.name} (${assign.weapon.category})\n`;
                }
            });

            if (bufferWeapons.length > 0) {
                copyText += `\n**【予備ブキリスト】**\n`;
                bufferWeapons.forEach(weapon => {
                    copyText += `- ${weapon.name} (または${weapon.category}種)\n`;
                });
            }
            copyText += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        }

        copyTextarea.value = copyText;

        // スムーズなスクロールで結果画面へ移動
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // --- 📋 8. Copy to Clipboard Functionality ---
    copyBtn.addEventListener('click', () => {
        const textToCopy = copyTextarea.value;
        if (!textToCopy) return;

        navigator.clipboard.writeText(textToCopy).then(() => {
            // コピー成功時のトースト演出
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✅ コピー完了！';
            copyBtn.style.background = '#10b981'; // 一時的に美しいグリーンに変更
            copyBtn.style.boxShadow = '0 4px 14px 0 rgba(16, 185, 129, 0.5)';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.background = ''; // 元に戻す
                copyBtn.style.boxShadow = '';
            }, 1800);
        }).catch(err => {
            console.error('Clipboard copy error:', err);
            alert('コピーに失敗しました。ブラウザの設定を確認してください。');
        });
    });

    // 安全なエスケープ処理
    const escapeHTML = (str) => {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    // --- 💬 Discord Webhook Integration ---
    const initDiscordWebhook = () => {
        // 誤爆防止およびセキュリティ配慮のため、URLは保存・復元せず常に空欄からスタートしますわ！
        // 以前の古い保存データがある場合は、安全のために消去（クリーンアップ）いたします
        localStorage.removeItem('discord_webhook_url');
        discordWebhookInput.value = '';
    };

    discordSendBtn.addEventListener('click', async () => {
        const url = discordWebhookInput.value.trim();
        const text = copyTextarea.value;

        if (!url) {
            alert('オプション設定で Discord Webhook URL を設定してほしいでし！');
            return;
        }

        if (!text) {
            alert('まずはルーレットを回して結果を生成してほしいでし！');
            return;
        }

        // アカウントに紐付く丸形ブキチアバター画像の絶対URLを自動解決しますわ！
        // new URL() を使うことで、ローカルでもデプロイ後（GitHub Pages等）でも相対的に完璧な絶対URLが固定で自動生成されます。
        const avatarUrl = new URL('bukichi_avatar.png', window.location.href).href;

        try {
            discordSendBtn.disabled = true;
            const originalText = discordSendBtn.innerHTML;
            discordSendBtn.innerHTML = '⏳ 送信中でし...';

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: 'ブキチ',
                    avatar_url: avatarUrl,
                    content: text
                })
            });

            if (!response.ok) {
                throw new Error('Discordへの送信に失敗しましたわ。URLが正しいか確認してください。');
            }

            // 送信成功時の演出
            discordSendBtn.innerHTML = '✅ 送信完了でし！';
            discordSendBtn.style.background = '#10b981'; // 一時的にグリーンに変更
            discordSendBtn.style.boxShadow = '0 4px 14px 0 rgba(16, 185, 129, 0.5)';

            setTimeout(() => {
                discordSendBtn.innerHTML = originalText;
                discordSendBtn.style.background = ''; // 元に戻す
                discordSendBtn.style.boxShadow = '';
                discordSendBtn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Discord Webhook Error:', error);
            alert(`送信エラーでし！\n${error.message}`);
            discordSendBtn.disabled = false;
            discordSendBtn.innerHTML = '💬 Discordに送信するでし！';
        }
    });

    // 抽選実行ボタン
    rollBtn.addEventListener('click', rollRoulette);
    rollAgainBtn.addEventListener('click', rollRoulette);

    // --- 🏁 9. Initialization ---
    initTheme();
    setupInitialPlayers();
    loadWeaponsCSV();
    loadSpecialRules();
    initDiscordWebhook();
});
