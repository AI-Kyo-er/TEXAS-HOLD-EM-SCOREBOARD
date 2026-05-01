import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleUserRound,
  RefreshCw,
  Grid2X2,
  LayoutList,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
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
  avatarStyle: string;
  avatarSeed: string;
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
  avatarSeed?: number | string;
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
  hiddenAt?: string;
};

type Store = {
  players: Player[];
  games: Game[];
};

const STORAGE_KEY = "poker-tracker-store-v1";
const green = "#36e24f";
const red = "#ff3148";
const neutral = "#97a3ad";
const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 810;
const GAMES_PER_PAGE = 8;
const AVATAR_STYLES = ["croodles", "lorelei-neutral", "notionists"];

function getViewportScale() {
  if (typeof window === "undefined") return 1;
  return Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);
}

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
    avatarStyle: AVATAR_STYLES[(avatarSeed - 1) % AVATAR_STYLES.length],
    avatarSeed: `demo-avatar-${avatarSeed}`,
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

function normalizePlayer(player: Partial<Player> & { avatarSeed?: string | number }, index: number): Player {
  const name = player.name?.trim() || `Player ${index + 1}`;
  const legacySeed = player.avatarSeed ?? `${name}-${index + 1}`;

  return {
    id: player.id || `p-${Date.now()}-${index}`,
    name,
    code: player.code || String(10000 + index + 1),
    avatarStyle: AVATAR_STYLES.includes(player.avatarStyle || "")
      ? player.avatarStyle || AVATAR_STYLES[index % AVATAR_STYLES.length]
      : AVATAR_STYLES[index % AVATAR_STYLES.length],
    avatarSeed: String(legacySeed),
    createdAt: player.createdAt || new Date().toISOString()
  };
}

function normalizeStore(store: Store): Store {
  const players = store.players.map((player, index) => normalizePlayer(player, index));
  return {
    players,
    games: store.games
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
    return normalizeStore(parsed);
  } catch {
    return { players: demoPlayers, games: demoGames };
  }
}

function App() {
  const [store, setStore] = useState<Store>(loadStore);
  const [viewportScale, setViewportScale] = useState(getViewportScale);
  const [activeView, setActiveView] = useState<"games" | "players">("games");
  const [expandedGameId, setExpandedGameId] = useState(store.games.find((game) => !game.hiddenAt)?.id ?? "");
  const [selectedPlayerId, setSelectedPlayerId] = useState(store.players[0]?.id ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showComposer, setShowComposer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [gameNote, setGameNote] = useState("周末常规局");
  const [durationHours, setDurationHours] = useState("3");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [selectedIds, setSelectedIds] = useState<string[]>(store.players.slice(0, 6).map((player) => player.id));
  const [range, setRange] = useState<"all" | "30" | "90" | "custom">("all");
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [confirmHideGames, setConfirmHideGames] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    const updateScale = () => {
      setViewportScale(getViewportScale());
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const activeGames = useMemo(() => store.games.filter((game) => !game.hiddenAt), [store.games]);

  const games = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return activeGames
      .filter((game) => !q || game.id.toLowerCase().includes(q) || game.note.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [activeGames, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(games.length / GAMES_PER_PAGE));
  const currentPageGames = useMemo(() => {
    const start = (currentPage - 1) * GAMES_PER_PAGE;
    return games.slice(start, start + GAMES_PER_PAGE);
  }, [currentPage, games]);
  const visibleGames = useMemo(() => {
    return currentPageGames;
  }, [currentPageGames]);
  const hasExpandedVisibleGame = visibleGames.some((game) => game.id === expandedGameId);
  const paginationItems = useMemo(() => getPaginationItems(currentPage, totalPages), [currentPage, totalPages]);

  const selectedPlayer = store.players.find((player) => player.id === selectedPlayerId) ?? store.players[0];

  const playerStats = useMemo(() => {
    return buildPlayerStats(activeGames, selectedPlayer?.id ?? "", range);
  }, [activeGames, selectedPlayer?.id, range]);

  const distribution = useMemo(() => buildDistribution(activeGames), [activeGames]);
  const playerById = useMemo(() => new Map(store.players.map((player) => [player.id, player])), [store.players]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setConfirmHideGames(false);
  }, [searchTerm, currentPage]);

  useEffect(() => {
    if (activeView === "games") return;
    setDeleteMode(false);
    setSelectedGameIds([]);
    setConfirmHideGames(false);
  }, [activeView]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function commitStore(next: Store) {
    setStore(next);
  }

  function makeRandomAvatar() {
    const entropy = `avatar-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return {
      avatarStyle: AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)],
      avatarSeed: entropy
    };
  }

  function addPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;

    const id = `p-${Date.now()}`;
    const avatar = makeRandomAvatar();
    const player: Player = {
      id,
      name,
      code: String(10000 + store.players.length + 1),
      ...avatar,
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

  function updatePlayerName(playerId: string, name: string) {
    const nextName = name.trimStart();
    commitStore({
      ...store,
      players: store.players.map((player) => (player.id === playerId ? { ...player, name: nextName } : player))
    });
  }

  function randomizePlayerAvatar(playerId: string) {
    const player = store.players.find((item) => item.id === playerId);
    if (!player) return;

    commitStore({
      ...store,
      players: store.players.map((item) =>
        item.id === playerId ? { ...item, ...makeRandomAvatar() } : item
      )
    });
  }

  function getPlayerUsage(playerId: string) {
    return activeGames.reduce(
      (usage, game) => {
        const entry = game.entries.find((item) => item.playerId === playerId);
        if (!entry) return usage;
        const profit = getEntryProfit(entry);
        return {
          games: usage.games + 1,
          profit: usage.profit + (profit ?? 0),
          rebuys: usage.rebuys + entry.rebuys.length
        };
      },
      { games: 0, profit: 0, rebuys: 0 }
    );
  }

  function deletePlayer(playerId: string) {
    if (getPlayerUsage(playerId).games > 0) return;

    const players = store.players.filter((player) => player.id !== playerId);
    commitStore({
      ...store,
      players
    });
    setSelectedIds((current) => current.filter((id) => id !== playerId));
    if (selectedPlayerId === playerId) {
      setSelectedPlayerId(players[0]?.id ?? "");
    }
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
    setCurrentPage(1);
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

  function enterDeleteMode() {
    setDeleteMode(true);
    setExpandedGameId("");
    setSelectedGameIds([]);
    setConfirmHideGames(false);
  }

  function cancelDeleteMode() {
    setDeleteMode(false);
    setSelectedGameIds([]);
    setConfirmHideGames(false);
  }

  function toggleGameSelection(gameId: string) {
    setSelectedGameIds((current) =>
      current.includes(gameId) ? current.filter((id) => id !== gameId) : [...current, gameId]
    );
    setConfirmHideGames(false);
  }

  function hideSelectedGames() {
    if (selectedGameIds.length === 0) return;

    if (!confirmHideGames) {
      setConfirmHideGames(true);
      return;
    }

    const hiddenAt = new Date().toISOString();
    const selected = new Set(selectedGameIds);
    commitStore({
      ...store,
      games: store.games.map((game) => (selected.has(game.id) ? { ...game, hiddenAt } : game))
    });
    cancelDeleteMode();
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  return (
    <div className="scale-viewport">
      <div
        className="scale-stage"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          zoom: viewportScale
        }}
      >
        <div className="app-shell">
          <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">
            P<span className="spade">♠</span>KER
          </div>
          <div className="brand-subtitle">TRACKER</div>
        </div>

        <button className="new-game-button" onClick={() => {
          setActiveView("games");
          setShowComposer(true);
        }}>
          <Plus size={22} />
          新牌局
        </button>

        <nav className="nav-list">
          <button className={`nav-item ${activeView === "games" ? "active" : ""}`} onClick={() => setActiveView("games")}>
            <LayoutList size={21} />
            牌局记录
          </button>
          <button className={`nav-item ${activeView === "players" ? "active" : ""}`} onClick={() => setActiveView("players")}>
            <CircleUserRound size={22} />
            玩家管理
          </button>
        </nav>

        <button className="settings-button">
          <Settings size={24} />
          设置
        </button>
          </aside>

          <main className="main-panel">
        {activeView === "games" ? (
          <>
        <header className="page-header games-header">
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
            <SlidersHorizontal size={19} />
            所有标签
            <ChevronDown size={17} />
          </button>
          <div className="toolbar-spacer" />
          {deleteMode ? (
            <>
              <button className="ghost-button delete-cancel-button" onClick={cancelDeleteMode}>
                取消
              </button>
              <button
                className={`danger-button delete-confirm-button ${confirmHideGames ? "confirming" : ""}`}
                disabled={selectedGameIds.length === 0}
                onClick={hideSelectedGames}
              >
                <Trash2 size={16} />
                {confirmHideGames ? "确认" : `删除 ${selectedGameIds.length} 项`}
              </button>
            </>
          ) : (
            <button className="danger-button delete-mode-button" onClick={enterDeleteMode}>
              <Trash2 size={16} />
            </button>
          )}
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
                  <Avatar player={player} />
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
            <span>{deleteMode ? "选择" : "操作"}</span>
          </div>

          <div className={`game-list ${hasExpandedVisibleGame ? "has-expanded" : ""}`}>
            {visibleGames.map((game) => {
              const selectedForHide = selectedGameIds.includes(game.id);
              return (
              <article key={game.id} className={`game-row ${selectedForHide ? "selected-for-hide" : ""}`}>
              <button
                className={`summary-row ${deleteMode ? "selection-row" : ""}`}
                onClick={() => {
                  if (deleteMode) {
                    toggleGameSelection(game.id);
                    return;
                  }
                  setExpandedGameId(expandedGameId === game.id ? "" : game.id);
                }}
              >
                <span className="game-id">{game.id}</span>
                <span>{formatDateTime(game.startedAt)}</span>
                <span>{formatDuration(game.durationMinutes)}</span>
                <span>{game.entries.length}</span>
                <span>{game.note}</span>
                <span className="row-action">
                  {deleteMode ? (
                    <span className={`row-checkbox ${selectedForHide ? "checked" : ""}`} aria-hidden="true" />
                  ) : expandedGameId === game.id ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </span>
              </button>

              {!deleteMode && expandedGameId === game.id ? (
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
                    const entryPlayer = playerById.get(entry.playerId);
                    return (
                      <div key={entry.playerId} className="details-row">
                        <span className="player-cell">
                          <Avatar player={entryPlayer} name={entryPlayer?.name ?? entry.playerName} />
                          {entryPlayer?.name ?? entry.playerName}
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
            );
            })}

            {visibleGames.length === 0 ? <div className="empty-row">暂无匹配牌局</div> : null}
          </div>

          <footer className="pagination">
            <button
              className="page-arrow"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft size={19} />
            </button>
            {paginationItems.map((item, index) =>
              item === "..." ? (
                <span key={`ellipsis-${index}`}>...</span>
              ) : (
                <button
                  key={item}
                  className={item === currentPage ? "active" : ""}
                  onClick={() => setCurrentPage(item)}
                >
                  {item}
                </button>
              )
            )}
            <button
              className="page-arrow"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              <ChevronRight size={19} />
            </button>
          </footer>
        </section>
          </>
        ) : (
          <section className="players-view">
            <header className="page-header players-header">
              <div>
                <h1>玩家管理</h1>
                <p>管理玩家姓名和头像</p>
              </div>
              <label className="players-add-inline">
                <input
                  value={newPlayerName}
                  onChange={(event) => setNewPlayerName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addPlayer();
                  }}
                  placeholder="添加新玩家姓名"
                />
                <button className="primary-button" onClick={addPlayer}>
                  添加
                </button>
              </label>
            </header>

            <div className="players-management-grid">
              {store.players.map((player) => {
                const canDelete = getPlayerUsage(player.id).games === 0;
                return (
                  <article key={player.id} className="management-card">
                    <div className="management-card-main">
                      <Avatar player={player} large />
                      <div className="management-fields">
                        <input
                          value={player.name}
                          onChange={(event) => updatePlayerName(player.id, event.target.value)}
                          onBlur={(event) => {
                            if (!event.target.value.trim()) updatePlayerName(player.id, "未命名玩家");
                          }}
                        />
                        <span>ID: {player.code}</span>
                      </div>
                    </div>

                    <div className="management-actions">
                      <button className="secondary-button" onClick={() => randomizePlayerAvatar(player.id)}>
                        <RefreshCw size={16} />
                        换头像
                      </button>
                      <button
                        className="danger-button"
                        disabled={!canDelete}
                        title={canDelete ? "删除玩家" : "仍有可见牌局记录的玩家不能删除"}
                        onClick={() => deletePlayer(player.id)}
                      >
                        <Trash2 size={16} />
                        删除
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
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
              <Avatar player={selectedPlayer} large />
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
                    innerRadius={28}
                    outerRadius={42}
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
      </div>
    </div>
  );
}

function Avatar({
  player,
  name,
  large = false
}: {
  player?: Pick<Player, "name" | "avatarStyle" | "avatarSeed">;
  name?: string;
  large?: boolean;
}) {
  const displayName = player?.name || name || "?";
  const [failed, setFailed] = useState(false);
  const style = AVATAR_STYLES.includes(player?.avatarStyle || "") ? player?.avatarStyle : AVATAR_STYLES[0];
  const seed = encodeURIComponent(player?.avatarSeed || displayName);
  const avatarUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;

  useEffect(() => {
    setFailed(false);
  }, [avatarUrl]);

  return (
    <span className={`avatar ${large ? "large" : ""}`}>
      {player && !failed ? <img src={avatarUrl} alt="" onError={() => setFailed(true)} /> : null}
      {(!player || failed) && (
        <span className="avatar-fallback" aria-label={displayName}>
          <CircleUserRound size={large ? 29 : 21} strokeWidth={1.8} />
        </span>
      )}
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

function getPaginationItems(currentPage: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage, "...", totalPages];
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
