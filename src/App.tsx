import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleUserRound,
  Filter,
  Grid2X2,
  LayoutList,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Trophy,
  UsersRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type Player = {
  id: string;
  name: string;
  code: string;
  avatarSeed: number;
  createdAt: string;
};

type Rebuy = {
  id: string;
  amountBB: 75 | 150;
  createdAt: string;
};

type GameEntry = {
  playerId: string;
  playerName: string;
  playerCode: string;
  avatarSeed: number;
  initialBuyInBB: 150;
  rebuys: Rebuy[];
  cashOutBB: number | "";
};

type Game = {
  id: string;
  startedAt: string;
  durationMinutes: number;
  note: string;
  entries: GameEntry[];
};

type Store = {
  players: Player[];
  games: Game[];
};

const STORAGE_KEY = "poker-tracker-store-v1";
const green = "#36e24f";
const red = "#ff3148";
const neutral = "#97a3ad";

const demoPlayers: Player[] = [
  makePlayer("p-tony", "Tony", "10001", 1),
  makePlayer("p-jason", "Jason", "10002", 2),
  makePlayer("p-kevin", "Kevin", "10003", 3),
  makePlayer("p-andy", "Andy", "10004", 4),
  makePlayer("p-leo", "Leo", "10005", 5),
  makePlayer("p-jack", "Jack", "10006", 6)
];

const demoGames: Game[] = [
  makeDemoGame("#20240518-003", "2024-05-18T20:00:00", 225, "周末常规局", [
    ["p-tony", 380, [[150, "2024-05-18T21:30:00"]]],
    ["p-jason", 96, []],
    ["p-kevin", 0, [[75, "2024-05-18T22:10:00"]]],
    ["p-andy", 210, []],
    ["p-leo", 144, [[150, "2024-05-18T21:00:00"]]],
    ["p-jack", 160, []]
  ]),
  makeDemoGame("#20240516-008", "2024-05-16T19:30:00", 252, "晚间局", [
    ["p-tony", 250, []],
    ["p-jason", 75, [[75, "2024-05-16T21:10:00"]]],
    ["p-andy", 210, []],
    ["p-leo", 90, []],
    ["p-jack", 225, [[150, "2024-05-16T22:00:00"]]]
  ]),
  makeDemoGame("#20240515-006", "2024-05-15T20:15:00", 178, "-", [
    ["p-tony", 80, []],
    ["p-kevin", 390, [[150, "2024-05-15T21:30:00"]]],
    ["p-andy", 155, []],
    ["p-leo", 125, []],
    ["p-jack", 0, [[150, "2024-05-15T21:50:00"]]],
    ["p-jason", 300, []]
  ]),
  makeDemoGame("#20240514-002", "2024-05-14T19:45:00", 200, "新人试玩局", [
    ["p-tony", 370, [[150, "2024-05-14T20:50:00"]]],
    ["p-andy", 30, []],
    ["p-jason", 190, []],
    ["p-kevin", 110, []]
  ]),
  makeDemoGame("#20240512-010", "2024-05-12T18:00:00", 245, "周末常规局", [
    ["p-tony", 500, [[150, "2024-05-12T19:20:00"]]],
    ["p-jason", 60, []],
    ["p-kevin", 90, [[75, "2024-05-12T20:10:00"]]],
    ["p-andy", 205, []],
    ["p-leo", 180, []],
    ["p-jack", 70, []]
  ]),
  makeDemoGame("#20240510-004", "2024-05-10T21:00:00", 215, "-", [
    ["p-tony", 210, []],
    ["p-jason", 120, []],
    ["p-kevin", 340, [[150, "2024-05-10T22:15:00"]]],
    ["p-andy", 115, []],
    ["p-jack", 45, []]
  ])
];

function makePlayer(id: string, name: string, code: string, avatarSeed: number): Player {
  return {
    id,
    name,
    code,
    avatarSeed,
    createdAt: new Date(2024, 4, avatarSeed).toISOString()
  };
}

function makeDemoGame(
  id: string,
  startedAt: string,
  durationMinutes: number,
  note: string,
  rows: [string, number, [number, string][]][]
): Game {
  return {
    id,
    startedAt,
    durationMinutes,
    note,
    entries: rows.map(([playerId, cashOutBB, rebuys]) => {
      const player = demoPlayers.find((item) => item.id === playerId)!;
      return {
        playerId,
        playerName: player.name,
        playerCode: player.code,
        avatarSeed: player.avatarSeed,
        initialBuyInBB: 150,
        cashOutBB,
        rebuys: rebuys.map(([amountBB, createdAt], index) => ({
          id: `${id}-${playerId}-${index}`,
          amountBB: amountBB as 75 | 150,
          createdAt
        }))
      };
    })
  };
}

function loadStore(): Store {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { players: demoPlayers, games: demoGames };
  }

  try {
    const parsed = JSON.parse(raw) as Store;
    if (!Array.isArray(parsed.players) || !Array.isArray(parsed.games)) {
      return { players: demoPlayers, games: demoGames };
    }
    return parsed;
  } catch {
    return { players: demoPlayers, games: demoGames };
  }
}

function App() {
  const [store, setStore] = useState<Store>(loadStore);
  const [expandedGameId, setExpandedGameId] = useState(store.games[0]?.id ?? "");
  const [selectedPlayerId, setSelectedPlayerId] = useState(store.players[0]?.id ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [gameNote, setGameNote] = useState("周末常规局");
  const [durationHours, setDurationHours] = useState("3");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [selectedIds, setSelectedIds] = useState<string[]>(store.players.slice(0, 6).map((player) => player.id));
  const [range, setRange] = useState<"all" | "30" | "90" | "custom">("all");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const games = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return store.games
      .filter((game) => !q || game.id.toLowerCase().includes(q) || game.note.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [store.games, searchTerm]);

  const selectedPlayer = store.players.find((player) => player.id === selectedPlayerId) ?? store.players[0];

  const playerStats = useMemo(() => {
    return buildPlayerStats(store.games, selectedPlayer?.id ?? "", range);
  }, [store.games, selectedPlayer?.id, range]);

  const distribution = useMemo(() => buildDistribution(store.games), [store.games]);

  function commitStore(next: Store) {
    setStore(next);
  }

  function addPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;

    const id = `p-${Date.now()}`;
    const player: Player = {
      id,
      name,
      code: String(10000 + store.players.length + 1),
      avatarSeed: store.players.length + 1,
      createdAt: new Date().toISOString()
    };

    commitStore({
      ...store,
      players: [...store.players, player]
    });
    setSelectedIds((current) => [...current, id]);
    setSelectedPlayerId(id);
    setNewPlayerName("");
  }

  function createGame() {
    const selectedPlayers = store.players.filter((player) => selectedIds.includes(player.id));
    if (selectedPlayers.length === 0) return;

    const now = new Date();
    const totalMinutes = Math.max(0, Number(durationHours || 0) * 60 + Number(durationMinutes || 0));
    const game: Game = {
      id: makeGameId(now, store.games.length + 1),
      startedAt: now.toISOString(),
      durationMinutes: totalMinutes,
      note: gameNote.trim() || "-",
      entries: selectedPlayers.map((player) => ({
        playerId: player.id,
        playerName: player.name,
        playerCode: player.code,
        avatarSeed: player.avatarSeed,
        initialBuyInBB: 150,
        rebuys: [],
        cashOutBB: ""
      }))
    };

    commitStore({
      ...store,
      games: [game, ...store.games]
    });
    setExpandedGameId(game.id);
    setShowComposer(false);
  }

  function addRebuy(gameId: string, playerId: string, amountBB: 75 | 150) {
    commitStore({
      ...store,
      games: store.games.map((game) =>
        game.id === gameId
          ? {
              ...game,
              entries: game.entries.map((entry) =>
                entry.playerId === playerId
                  ? {
                      ...entry,
                      rebuys: [
                        ...entry.rebuys,
                        {
                          id: `r-${Date.now()}-${amountBB}`,
                          amountBB,
                          createdAt: new Date().toISOString()
                        }
                      ]
                    }
                  : entry
              )
            }
          : game
      )
    });
  }

  function updateCashOut(gameId: string, playerId: string, value: string) {
    const nextValue = value === "" ? "" : Math.max(0, Math.floor(Number(value)));
    if (Number.isNaN(nextValue as number)) return;

    commitStore({
      ...store,
      games: store.games.map((game) =>
        game.id === gameId
          ? {
              ...game,
              entries: game.entries.map((entry) =>
                entry.playerId === playerId ? { ...entry, cashOutBB: nextValue } : entry
              )
            }
          : game
      )
    });
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">
            P<span className="spade">♠</span>KER
          </div>
          <div className="brand-subtitle">TRACKER</div>
        </div>

        <button className="new-game-button" onClick={() => setShowComposer(true)}>
          <Plus size={22} />
          新牌局
        </button>

        <nav className="nav-list">
          <a className="nav-item active">
            <LayoutList size={21} />
            牌局记录
          </a>
          <a className="nav-item">
            <CircleUserRound size={22} />
            玩家
          </a>
        </nav>

        <button className="settings-button">
          <Settings size={24} />
          设置
        </button>
      </aside>

      <main className="main-panel">
        <header className="page-header">
          <div>
            <h1>牌局记录</h1>
            <p>查看和管理所有牌局的结算结果</p>
          </div>
          <label className="search-box">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="搜索牌局编号或备注"
            />
            <Search size={22} />
          </label>
        </header>

        <section className="toolbar">
          <button className="filter-pill">
            <CalendarDays size={19} />
            全部时间
            <ChevronDown size={17} />
          </button>
          <button className="filter-pill">
            <Grid2X2 size={19} />
            所有游戏
            <ChevronDown size={17} />
          </button>
          <button className="filter-pill">
            <SlidersHorizontal size={19} />
            所有备注
            <ChevronDown size={17} />
          </button>
          <div className="toolbar-spacer" />
          <button className="filter-pill compact">
            最新在前
            <ChevronDown size={17} />
          </button>
          <button className="icon-button">
            <Filter size={21} />
          </button>
        </section>

        {showComposer ? (
          <section className="composer">
            <div className="composer-header">
              <div>
                <h2>新牌局</h2>
                <p>选择入局玩家，系统会自动记录每人 150 BB 初始买入。</p>
              </div>
              <button className="ghost-button" onClick={() => setShowComposer(false)}>
                收起
              </button>
            </div>

            <div className="composer-grid">
              <label>
                备注
                <input value={gameNote} onChange={(event) => setGameNote(event.target.value)} />
              </label>
              <label>
                时长小时
                <input
                  type="number"
                  min="0"
                  value={durationHours}
                  onChange={(event) => setDurationHours(event.target.value)}
                />
              </label>
              <label>
                时长分钟
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                />
              </label>
            </div>

            <div className="player-picker">
              {store.players.map((player) => (
                <button
                  key={player.id}
                  className={`player-chip ${selectedIds.includes(player.id) ? "selected" : ""}`}
                  onClick={() => toggleSelected(player.id)}
                >
                  <Avatar seed={player.avatarSeed} name={player.name} />
                  {player.name}
                </button>
              ))}
            </div>

            <div className="add-player-row">
              <input
                value={newPlayerName}
                onChange={(event) => setNewPlayerName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addPlayer();
                }}
                placeholder="添加新玩家姓名"
              />
              <button className="secondary-button" onClick={addPlayer}>
                添加玩家
              </button>
              <button className="primary-button" onClick={createGame}>
                创建牌局
              </button>
            </div>
          </section>
        ) : null}

        <section className="games-table">
          <div className="table-head">
            <span>牌局编号</span>
            <span>开始时间</span>
            <span>时长</span>
            <span>玩家数</span>
            <span>备注</span>
            <span>操作</span>
          </div>

          {games.map((game) => (
            <article key={game.id} className="game-row">
              <button
                className="summary-row"
                onClick={() => setExpandedGameId(expandedGameId === game.id ? "" : game.id)}
              >
                <span className="game-id">{game.id}</span>
                <span>{formatDateTime(game.startedAt)}</span>
                <span>{formatDuration(game.durationMinutes)}</span>
                <span>{game.entries.length}</span>
                <span>{game.note}</span>
                <span className="row-action">
                  {expandedGameId === game.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </span>
              </button>

              {expandedGameId === game.id ? (
                <div className="details-table">
                  <div className="details-head">
                    <span>玩家</span>
                    <span>入局筹码</span>
                    <span>补筹记录</span>
                    <span>离场筹码</span>
                    <span>输/赢 (BB)</span>
                    <span>结果</span>
                  </div>

                  {game.entries.map((entry) => {
                    const profit = getEntryProfit(entry);
                    return (
                      <div key={entry.playerId} className="details-row">
                        <span className="player-cell">
                          <Avatar seed={entry.avatarSeed} name={entry.playerName} />
                          {entry.playerName}
                        </span>
                        <span>150 BB</span>
                        <span className="rebuy-cell">
                          <span>{formatRebuys(entry.rebuys)}</span>
                          <span className="rebuy-actions">
                            <button onClick={() => addRebuy(game.id, entry.playerId, 150)}>+150</button>
                            <button onClick={() => addRebuy(game.id, entry.playerId, 75)}>+75</button>
                          </span>
                        </span>
                        <span>
                          <input
                            className="cash-input"
                            type="number"
                            min="0"
                            value={entry.cashOutBB}
                            onChange={(event) => updateCashOut(game.id, entry.playerId, event.target.value)}
                            placeholder="0"
                          />
                          <em>BB</em>
                        </span>
                        <Profit value={profit} withUnit />
                        <Profit value={profit} />
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </article>
          ))}

          <footer className="pagination">
            <ChevronLeft size={19} />
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <span>...</span>
            <button>8</button>
            <ChevronRight size={19} />
          </footer>
        </section>
      </main>

      <aside className="stats-panel">
        <section className="stats-card player-card">
          <div className="panel-title">
            <h2>玩家统计</h2>
            <label className="select-wrap">
              <select value={selectedPlayerId} onChange={(event) => setSelectedPlayerId(event.target.value)}>
                {store.players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </label>
          </div>

          {selectedPlayer ? (
            <div className="profile-line">
              <Avatar seed={selectedPlayer.avatarSeed} name={selectedPlayer.name} large />
              <div>
                <strong>{selectedPlayer.name}</strong>
                <span>ID: {selectedPlayer.code}</span>
              </div>
            </div>
          ) : null}

          <div className="range-tabs">
            {[
              ["all", "全部"],
              ["30", "近 30 天"],
              ["90", "近 90 天"],
              ["custom", "自定义"]
            ].map(([key, label]) => (
              <button
                key={key}
                className={range === key ? "active" : ""}
                onClick={() => setRange(key as "all" | "30" | "90" | "custom")}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="stats-grid">
            <Stat label="总盈利" value={`${formatSigned(playerStats.totalProfit)} BB`} hot />
            <Stat label="总时长" value={formatTotalDuration(playerStats.totalMinutes)} />
            <Stat label="参与牌局" value={String(playerStats.games)} />
            <Stat label="胜率" value={`${playerStats.winRate.toFixed(1)}%`} />
            <Stat label="平均盈利" value={`${formatSigned(playerStats.avgProfit)} BB/局`} hot />
            <Stat label="最大单局盈利" value={`${formatSigned(playerStats.maxProfit)} BB`} hot />
            <Stat label="补筹次数" value={String(playerStats.rebuyCount)} />
            <Stat label="补筹总额" value={`${playerStats.rebuyTotal} BB`} />
          </div>
        </section>

        <section className="stats-card chart-card">
          <div className="panel-title">
            <h2>盈利走势 (BB)</h2>
            <button className="filter-pill mini">
              BB
              <ChevronDown size={16} />
            </button>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={playerStats.trend} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={green} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={green} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#88949e", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#88949e", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#101a22", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }}
                  labelStyle={{ color: "#dfe7ef" }}
                />
                <Area type="monotone" dataKey="value" stroke={green} strokeWidth={2.5} fill="url(#profitFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="stats-card donut-card">
          <h2>结果分布</h2>
          <div className="donut-layout">
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution.rows}
                    innerRadius={43}
                    outerRadius={62}
                    dataKey="value"
                    stroke="rgba(7,14,20,.8)"
                    strokeWidth={2}
                  >
                    {distribution.rows.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <strong>{distribution.total}</strong>
                <span>总局数</span>
              </div>
            </div>
            <div className="legend">
              {distribution.rows.map((item) => (
                <div key={item.name}>
                  <i style={{ background: item.color }} />
                  <span>{item.name}</span>
                  <strong>
                    {item.value} ({distribution.total ? ((item.value / distribution.total) * 100).toFixed(1) : "0.0"}%)
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}

function Avatar({ seed, name, large = false }: { seed: number; name: string; large?: boolean }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <span className={`avatar avatar-${(seed % 6) + 1} ${large ? "large" : ""}`}>
      <span>{initials}</span>
    </span>
  );
}

function Stat({ label, value, hot = false }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="stat-item">
      <span>{label}</span>
      <strong className={hot ? (value.startsWith("-") ? "loss" : "profit") : ""}>{value}</strong>
    </div>
  );
}

function Profit({ value, withUnit = false }: { value: number | null; withUnit?: boolean }) {
  if (value === null) return <span className="muted">未结算</span>;
  const className = value > 0 ? "profit" : value < 0 ? "loss" : "muted";
  return <span className={className}>{`${formatSigned(value)}${withUnit ? " BB" : ""}`}</span>;
}

function getEntryProfit(entry: GameEntry): number | null {
  if (entry.cashOutBB === "") return null;
  return Number(entry.cashOutBB) - entry.initialBuyInBB - entry.rebuys.reduce((sum, rebuy) => sum + rebuy.amountBB, 0);
}

function buildPlayerStats(games: Game[], playerId: string, range: "all" | "30" | "90" | "custom") {
  const now = new Date();
  const lowerBound =
    range === "30" || range === "90" ? now.getTime() - Number(range) * 24 * 60 * 60 * 1000 : Number.NEGATIVE_INFINITY;
  const rows = games
    .filter((game) => new Date(game.startedAt).getTime() >= lowerBound)
    .map((game) => ({ game, entry: game.entries.find((entry) => entry.playerId === playerId) }))
    .filter((row): row is { game: Game; entry: GameEntry } => Boolean(row.entry))
    .map(({ game, entry }) => ({ game, entry, profit: getEntryProfit(entry) }))
    .filter((row): row is { game: Game; entry: GameEntry; profit: number } => row.profit !== null)
    .sort((a, b) => new Date(a.game.startedAt).getTime() - new Date(b.game.startedAt).getTime());

  let cumulative = 0;
  const trend = rows.map(({ game, profit }) => {
    cumulative += profit;
    return {
      label: formatShortDate(game.startedAt),
      value: cumulative
    };
  });

  const totalProfit = rows.reduce((sum, row) => sum + row.profit, 0);
  const wins = rows.filter((row) => row.profit > 0).length;
  const rebuyCount = rows.reduce((sum, row) => sum + row.entry.rebuys.length, 0);
  const rebuyTotal = rows.reduce(
    (sum, row) => sum + row.entry.rebuys.reduce((inner, rebuy) => inner + rebuy.amountBB, 0),
    0
  );

  return {
    totalProfit,
    totalMinutes: rows.reduce((sum, row) => sum + row.game.durationMinutes, 0),
    games: rows.length,
    winRate: rows.length ? (wins / rows.length) * 100 : 0,
    avgProfit: rows.length ? Math.round(totalProfit / rows.length) : 0,
    maxProfit: rows.length ? Math.max(...rows.map((row) => row.profit)) : 0,
    rebuyCount,
    rebuyTotal,
    trend: trend.length ? trend : [{ label: "暂无", value: 0 }]
  };
}

function buildDistribution(games: Game[]) {
  const profits = games.flatMap((game) =>
    game.entries.map((entry) => getEntryProfit(entry)).filter((profit): profit is number => profit !== null)
  );
  const win = profits.filter((value) => value > 0).length;
  const loss = profits.filter((value) => value < 0).length;
  const draw = profits.filter((value) => value === 0).length;

  return {
    total: profits.length,
    rows: [
      { name: "盈利局", value: win, color: green },
      { name: "亏损局", value: loss, color: red },
      { name: "平局", value: draw, color: "#9aa4ad" }
    ]
  };
}

function makeGameId(date: Date, index: number) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `#${y}${m}${d}-${String(index).padStart(3, "0")}`;
}

function formatRebuys(rebuys: Rebuy[]) {
  if (!rebuys.length) return "-";
  return rebuys.map((rebuy) => `+${rebuy.amountBB} BB (${formatTime(rebuy.createdAt)})`).join(" / ");
}

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value.toLocaleString("zh-CN")}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(
    2,
    "0"
  )} ${formatTime(value)}`;
}

function formatShortDate(value: string) {
  const date = new Date(value);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function formatTime(value: string) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatTotalDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}:00`;
}

export default App;
