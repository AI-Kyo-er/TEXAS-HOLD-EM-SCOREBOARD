import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleUserRound,
  RefreshCw,
  LayoutList,
  Minus,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  Trophy,
  UsersRound,
  X
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

declare global {
  interface Window {
    pokerWindow?: {
      minimize: () => void;
      close: () => void;
    };
  }
}

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
  amountBB: number;
  createdAt: string;
};

type GameEntry = {
  playerId: string;
  playerName: string;
  playerCode: string;
  avatarSeed?: number | string;
  initialBuyInBB: number;
  rebuys: Rebuy[];
  cashOutAmount?: number | "";
  cashOutBB: number | "";
};

type Game = {
  id: string;
  startedAt: string;
  durationMinutes?: number;
  note?: string;
  cashPerBB: number;
  tags: string[];
  entries: GameEntry[];
  hiddenAt?: string;
};

type Store = {
  players: Player[];
  games: Game[];
  tags: string[];
  settings: AppSettings;
};

type TimeFilter = "today" | "week" | "month" | "all";
type FilterMenu = "time" | "tags" | null;

type AppSettings = {
  initialBuyInBB: number;
  rebuyOptionsBB: [number, number];
  cashPerBB: number;
};

const STORAGE_KEY = "poker-tracker-store-v1";
const green = "#36e24f";
const red = "#ff3148";
const neutral = "#97a3ad";
const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 810;
const TITLEBAR_HEIGHT = 40;
const GAMES_PER_PAGE = 8;
const DEFAULT_SETTINGS: AppSettings = {
  initialBuyInBB: 150,
  rebuyOptionsBB: [150, 75],
  cashPerBB: 2000
};
const AVATAR_STYLES = ["croodles", "lorelei-neutral", "notionists"];
const TIME_FILTER_OPTIONS: Array<{ key: TimeFilter; label: string }> = [
  { key: "today", label: "今天" },
  { key: "week", label: "本周" },
  { key: "month", label: "本月" },
  { key: "all", label: "全部时间" }
];
const TIME_FILTER_LABELS = Object.fromEntries(
  TIME_FILTER_OPTIONS.map((option) => [option.key, option.label])
) as Record<TimeFilter, string>;

function getViewportScale() {
  if (typeof window === "undefined") return 1;
  return Math.min(window.innerWidth / DESIGN_WIDTH, (window.innerHeight - TITLEBAR_HEIGHT) / DESIGN_HEIGHT);
}

const demoPlayers: Player[] = [
  makePlayer("p-nina", "井芹仁菜", "10001", 1),
  makePlayer("p-momoka", "河原木桃香", "10002", 2),
  makePlayer("p-subaru", "安和昴", "10003", 3),
  makePlayer("p-tomo", "海老塚智", "10004", 4),
  makePlayer("p-rupa", "鲁帕", "10005", 5)
];

const demoGames: Game[] = [
  makeDemoGame("#20240518-003", "2024-05-18T20:00:00", 225, "周末局", [
    ["p-nina", 380, [[150, "2024-05-18T21:30:00"]]],
    ["p-momoka", 96, []],
    ["p-subaru", 0, [[75, "2024-05-18T22:10:00"]]],
    ["p-tomo", 210, []],
    ["p-rupa", 144, [[150, "2024-05-18T21:00:00"]]]
  ]),
  makeDemoGame("#20240516-008", "2024-05-16T19:30:00", 252, "新人局", [
    ["p-nina", 250, []],
    ["p-momoka", 75, [[75, "2024-05-16T21:10:00"]]],
    ["p-tomo", 210, []],
    ["p-rupa", 90, []],
    ["p-subaru", 225, [[150, "2024-05-16T22:00:00"]]]
  ]),
  makeDemoGame("#20240515-006", "2024-05-15T20:15:00", 178, "练习局", [
    ["p-nina", 80, []],
    ["p-subaru", 390, [[150, "2024-05-15T21:30:00"]]],
    ["p-tomo", 155, []],
    ["p-rupa", 125, []],
    ["p-momoka", 300, []]
  ]),
  makeDemoGame("#20240514-002", "2024-05-14T19:45:00", 200, "朋友局", [
    ["p-nina", 370, [[150, "2024-05-14T20:50:00"]]],
    ["p-tomo", 30, []],
    ["p-momoka", 190, []],
    ["p-subaru", 110, []]
  ]),
  makeDemoGame("#20240512-010", "2024-05-12T18:00:00", 245, "周末局", [
    ["p-nina", 500, [[150, "2024-05-12T19:20:00"]]],
    ["p-momoka", 60, []],
    ["p-subaru", 90, [[75, "2024-05-12T20:10:00"]]],
    ["p-tomo", 205, []],
    ["p-rupa", 180, []]
  ]),
  makeDemoGame("#20240510-004", "2024-05-10T21:00:00", 215, "深夜局", [
    ["p-nina", 210, []],
    ["p-momoka", 120, []],
    ["p-subaru", 340, [[150, "2024-05-10T22:15:00"]]],
    ["p-tomo", 115, []],
    ["p-rupa", 45, []]
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
    cashPerBB: DEFAULT_SETTINGS.cashPerBB,
    tags: normalizeTags(note === "-" ? [] : [note]),
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
          amountBB,
          createdAt
        }))
      };
    })
  };
}

function normalizeTag(tag: string) {
  return tag.trim().replace(/\s+/g, " ");
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return Array.from(
    new Set(
      tags
        .map((tag) => (typeof tag === "string" ? normalizeTag(tag) : ""))
        .filter(Boolean)
    )
  );
}

function normalizeGame(game: Partial<Game> & { note?: string }, index: number): Game {
  const legacyTag = game.note && game.note !== "-" ? [game.note] : [];
  const hasTagsField = Object.prototype.hasOwnProperty.call(game, "tags");
  return {
    id: game.id || `#${index + 1}`,
    startedAt: game.startedAt || new Date().toISOString(),
    durationMinutes: game.durationMinutes,
    note: game.note,
    cashPerBB: normalizeCashValue(game.cashPerBB, DEFAULT_SETTINGS.cashPerBB),
    tags: normalizeTags(hasTagsField ? game.tags : legacyTag),
    entries: Array.isArray(game.entries) ? game.entries : [],
    hiddenAt: game.hiddenAt
  };
}

function getStoreTags(games: Game[], tags?: unknown) {
  return normalizeTags([...(Array.isArray(tags) ? tags : []), ...games.flatMap((game) => game.tags)]);
}

function normalizeBBValue(value: unknown, fallback: number, allowZero = false) {
  const numberValue = Number(value);
  const min = allowZero ? 0 : 0.5;
  if (!Number.isFinite(numberValue) || numberValue < min) return fallback;
  return Math.round(numberValue * 2) / 2;
}

function normalizeCashValue(value: unknown, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return fallback;
  return Math.round(numberValue * 100) / 100;
}

function normalizeSettings(settings?: Partial<AppSettings>): AppSettings {
  return {
    initialBuyInBB: normalizeBBValue(settings?.initialBuyInBB, DEFAULT_SETTINGS.initialBuyInBB),
    rebuyOptionsBB: [
      normalizeBBValue(settings?.rebuyOptionsBB?.[0], DEFAULT_SETTINGS.rebuyOptionsBB[0]),
      normalizeBBValue(settings?.rebuyOptionsBB?.[1], DEFAULT_SETTINGS.rebuyOptionsBB[1])
    ],
    cashPerBB: normalizeCashValue(settings?.cashPerBB, DEFAULT_SETTINGS.cashPerBB)
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

function normalizeStore(store: Partial<Store> & { tags?: unknown }): Store {
  const players = (store.players || []).map((player, index) => normalizePlayer(player, index));
  const games = (store.games || []).map((game, index) => normalizeGame(game, index));
  return {
    players,
    games,
    tags: getStoreTags(games, store.tags),
    settings: normalizeSettings(store.settings)
  };
}

function loadStore(): Store {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return normalizeStore({ players: demoPlayers, games: demoGames, tags: [] });
  }

  try {
    const parsed = JSON.parse(raw) as Store;
    if (!Array.isArray(parsed.players) || !Array.isArray(parsed.games)) {
      return normalizeStore({ players: demoPlayers, games: demoGames, tags: [] });
    }
    return normalizeStore(parsed);
  } catch {
    return normalizeStore({ players: demoPlayers, games: demoGames, tags: [] });
  }
}

function App() {
  const [store, setStore] = useState<Store>(loadStore);
  const [viewportScale, setViewportScale] = useState(getViewportScale);
  const [activeView, setActiveView] = useState<"games" | "players" | "settings">("games");
  const [expandedGameId, setExpandedGameId] = useState(store.games.find((game) => !game.hiddenAt)?.id ?? "");
  const [selectedPlayerId, setSelectedPlayerId] = useState(store.players[0]?.id ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showComposer, setShowComposer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newGameTag, setNewGameTag] = useState("");
  const [selectedGameTags, setSelectedGameTags] = useState<string[]>(store.tags.slice(0, 1));
  const [selectedIds, setSelectedIds] = useState<string[]>(store.players.slice(0, 6).map((player) => player.id));
  const [range, setRange] = useState<"all" | "30" | "90" | "custom">("all");
  const [playerMenuOpen, setPlayerMenuOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [confirmHideGames, setConfirmHideGames] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);
  const [openFilterMenu, setOpenFilterMenu] = useState<FilterMenu>(null);
  const [manageTags, setManageTags] = useState(false);

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
      .filter((game) => isInTimeFilter(game.startedAt, timeFilter))
      .filter((game) => selectedFilterTags.every((tag) => game.tags.includes(tag)))
      .filter(
        (game) =>
          !q ||
          game.id.toLowerCase().includes(q) ||
          game.tags.some((tag) => tag.toLowerCase().includes(q))
      )
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [activeGames, searchTerm, selectedFilterTags, timeFilter]);

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
    return buildPlayerStats(games, selectedPlayer?.id ?? "", range);
  }, [games, selectedPlayer?.id, range]);

  const distribution = useMemo(() => buildDistribution(games, selectedPlayer?.id ?? ""), [games, selectedPlayer?.id]);
  const playerById = useMemo(() => new Map(store.players.map((player) => [player.id, player])), [store.players]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilterTags, timeFilter]);

  useEffect(() => {
    setConfirmHideGames(false);
  }, [searchTerm, currentPage, selectedFilterTags, timeFilter]);

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

  function addTagToLibrary(rawTag: string) {
    const tag = normalizeTag(rawTag);
    if (!tag) return;

    const tags = normalizeTags([...store.tags, tag]);
    commitStore({
      ...store,
      tags
    });
    setSelectedGameTags((current) => (current.includes(tag) ? current : [...current, tag]));
    setNewGameTag("");
  }

  function toggleGameTag(tag: string) {
    setSelectedGameTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  }

  function toggleFilterTag(tag: string) {
    setSelectedFilterTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  }

  function deleteTag(tag: string) {
    commitStore({
      ...store,
      tags: store.tags.filter((item) => item !== tag),
      games: store.games.map((game) => ({
        ...game,
        tags: game.tags.filter((item) => item !== tag)
      }))
    });
    setSelectedGameTags((current) => current.filter((item) => item !== tag));
    setSelectedFilterTags((current) => current.filter((item) => item !== tag));
  }

  function updateSettingsField(field: "initialBuyInBB" | "rebuyOption0" | "rebuyOption1" | "cashPerBB", value: string) {
    const nextValue = field === "cashPerBB" ? normalizeCashValue(value, 0) : normalizeBBValue(value, 0);
    if (!nextValue) return;

    const nextSettings: AppSettings =
      field === "initialBuyInBB"
        ? { ...store.settings, initialBuyInBB: nextValue }
        : field === "cashPerBB"
          ? { ...store.settings, cashPerBB: nextValue }
        : {
            ...store.settings,
            rebuyOptionsBB:
              field === "rebuyOption0"
                ? [nextValue, store.settings.rebuyOptionsBB[1]]
                : [store.settings.rebuyOptionsBB[0], nextValue]
          };

    commitStore({
      ...store,
      settings: nextSettings
    });
  }

  function createGame() {
    const selectedPlayers = store.players.filter((player) => selectedIds.includes(player.id));
    if (selectedPlayers.length === 0) return;

    const now = new Date();
    const game: Game = {
      id: makeGameId(now, store.games.length + 1),
      startedAt: now.toISOString(),
      cashPerBB: store.settings.cashPerBB,
      tags: selectedGameTags,
      entries: selectedPlayers.map((player) => ({
        playerId: player.id,
        playerName: player.name,
        playerCode: player.code,
        avatarSeed: player.avatarSeed,
        initialBuyInBB: store.settings.initialBuyInBB,
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

  function addRebuy(gameId: string, playerId: string, amountBB: number) {
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

  function updateCashOutAmount(gameId: string, playerId: string, value: string) {
    const nextAmount = value.trim() === "" ? "" : Number(value);
    if (nextAmount !== "" && (!Number.isFinite(nextAmount) || nextAmount < 0)) return;

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
                      cashOutAmount: nextAmount,
                      cashOutBB: nextAmount === "" ? "" : nextAmount / game.cashPerBB
                    }
                  : entry
              )
            }
          : game
      )
    });
  }

  function updateGameCashPerBB(gameId: string, value: string) {
    const nextCashPerBB = normalizeCashValue(value, 0);
    if (!nextCashPerBB) return;

    commitStore({
      ...store,
      games: store.games.map((game) => {
        if (game.id !== gameId) return game;
        const previousCashPerBB = game.cashPerBB || DEFAULT_SETTINGS.cashPerBB;
        return {
          ...game,
          cashPerBB: nextCashPerBB,
          entries: game.entries.map((entry) => {
            const cashOutAmount =
              entry.cashOutAmount !== undefined && entry.cashOutAmount !== ""
                ? entry.cashOutAmount
                : entry.cashOutBB === ""
                  ? ""
                  : Number(entry.cashOutBB) * previousCashPerBB;
            return {
              ...entry,
              cashOutAmount,
              cashOutBB: cashOutAmount === "" ? "" : cashOutAmount / nextCashPerBB
            };
          })
        };
      })
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
    <div className="app-frame">
      <header className="window-titlebar">
        <div className="window-titlebar-brand">Poker Tracker</div>
        <div className="window-controls">
          <button
            className="window-control"
            aria-label="最小化"
            onClick={() => window.pokerWindow?.minimize()}
          >
            <Minus size={15} />
          </button>
          <button
            className="window-control close"
            aria-label="关闭"
            onClick={() => window.pokerWindow?.close()}
          >
            <X size={15} />
          </button>
        </div>
      </header>
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

        <button
          className={`new-game-button ${activeView === "games" && showComposer ? "cancel" : ""}`}
          onClick={() => {
            if (activeView === "games" && showComposer) {
              setShowComposer(false);
              setManageTags(false);
              return;
            }
            setActiveView("games");
            setShowComposer(true);
          }}
        >
          {activeView === "games" && showComposer ? <X size={22} /> : <Plus size={22} />}
          {activeView === "games" && showComposer ? "取消" : "新牌局"}
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

        <button
          className={`settings-button ${activeView === "settings" ? "active" : ""}`}
          onClick={() => setActiveView("settings")}
        >
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
              placeholder="搜索牌局编号或标签"
            />
            <Search size={22} />
          </label>
        </header>

        <section className="toolbar">
          <div className="filter-control">
            <button
              className={`filter-pill ${openFilterMenu === "time" || timeFilter !== "all" ? "active" : ""}`}
              onClick={() => setOpenFilterMenu((current) => (current === "time" ? null : "time"))}
            >
              <CalendarDays size={19} />
              {TIME_FILTER_LABELS[timeFilter]}
              <ChevronDown size={17} />
            </button>
            {openFilterMenu === "time" ? (
              <div className="filter-menu">
                {TIME_FILTER_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    className={timeFilter === key ? "active" : ""}
                    onClick={() => {
                      setTimeFilter(key);
                      setOpenFilterMenu(null);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="filter-control">
            <button
              className={`filter-pill ${openFilterMenu === "tags" || selectedFilterTags.length ? "active" : ""}`}
              onClick={() => setOpenFilterMenu((current) => (current === "tags" ? null : "tags"))}
            >
              <SlidersHorizontal size={19} />
              {selectedFilterTags.length ? `${selectedFilterTags.length} 个标签` : "所有标签"}
              <ChevronDown size={17} />
            </button>
            {openFilterMenu === "tags" ? (
              <div className="filter-menu tag-filter-menu">
                {store.tags.length ? (
                  store.tags.map((tag) => (
                    <button
                      key={tag}
                      className={selectedFilterTags.includes(tag) ? "active" : ""}
                      onClick={() => toggleFilterTag(tag)}
                    >
                      <span className={`filter-check ${selectedFilterTags.includes(tag) ? "checked" : ""}`} />
                      {tag}
                    </button>
                  ))
                ) : (
                  <span className="filter-empty">暂无标签</span>
                )}
              </div>
            ) : null}
          </div>
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
                <p>选择入局玩家，系统会自动记录每人 {store.settings.initialBuyInBB} BB 初始买入。</p>
              </div>
            </div>

            <div className="tag-composer">
              <div className="tag-composer-head">
                <div className="tag-title">
                  <span>标签</span>
                  <button type="button" onClick={() => setManageTags((current) => !current)}>
                    {manageTags ? "完成" : "管理"}
                  </button>
                </div>
              </div>
              <div className="tag-picker">
                {store.tags.length ? (
                  store.tags.map((tag) => (
                    <button
                      key={tag}
                      className={`tag-chip ${selectedGameTags.includes(tag) ? "selected" : ""} ${manageTags ? "manage" : ""}`}
                      onClick={() => (manageTags ? deleteTag(tag) : toggleGameTag(tag))}
                    >
                      {tag}
                      {manageTags ? <span className="tag-delete-mark">×</span> : null}
                    </button>
                  ))
                ) : (
                  <span className="tag-empty">暂无标签，可直接新增</span>
                )}
                {!manageTags ? (
                  <input
                    className="tag-inline-input"
                    style={{ width: `${Math.max(112, Math.min(220, newGameTag.length * 12 + 92))}px` }}
                    value={newGameTag}
                    onChange={(event) => setNewGameTag(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTagToLibrary(newGameTag);
                      }
                    }}
                    onBlur={() => addTagToLibrary(newGameTag)}
                    placeholder="新增标签"
                  />
                ) : null}
              </div>
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
            <span>标签</span>
            <span>玩家数</span>
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
                <span className="tag-list">
                  {game.tags.length ? (
                    game.tags.map((tag) => (
                      <span key={tag} className="tag-chip compact">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="muted">无标签</span>
                  )}
                </span>
                <span>{game.entries.length}</span>
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
                  <div className="details-config">
                    <span>本局 1 BB 金额</span>
                    <label className="details-cash-rate">
                      <input
                        type="number"
                        min="1"
                        step="100"
                        value={game.cashPerBB}
                        onChange={(event) => updateGameCashPerBB(game.id, event.target.value)}
                        onBlur={(event) => {
                          if (!normalizeCashValue(event.target.value, 0)) {
                            event.currentTarget.value = String(game.cashPerBB);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="details-head">
                    <span>玩家</span>
                    <span>入局筹码</span>
                    <span>补筹记录</span>
                    <span>离场金额</span>
                    <span>离场筹码</span>
                    <span>输/赢 (BB)</span>
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
                        <span>{entry.initialBuyInBB} BB</span>
                        <span className="rebuy-cell">
                          <span>{formatRebuys(entry.rebuys)}</span>
                          <span className="rebuy-actions">
                            {store.settings.rebuyOptionsBB.map((amount) => (
                              <button key={amount} onClick={() => addRebuy(game.id, entry.playerId, amount)}>
                                +{amount}
                              </button>
                            ))}
                          </span>
                        </span>
                        <span>
                          <input
                            className="cash-input cash-amount-input"
                            type="number"
                            min="0"
                            step={game.cashPerBB}
                            value={getCashOutAmount(entry, game.cashPerBB)}
                            onChange={(event) => updateCashOutAmount(game.id, entry.playerId, event.target.value)}
                            placeholder="0"
                          />
                        </span>
                        <span className="cash-bb-value">
                          {entry.cashOutBB === "" ? (
                            <span className="muted">未结算</span>
                          ) : (
                            <>
                              {formatNumber(entry.cashOutBB)}
                              <em>BB</em>
                            </>
                          )}
                        </span>
                        <Profit value={profit} withUnit />
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
        ) : activeView === "players" ? (
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
        ) : (
          <section className="settings-view">
            <header className="page-header settings-header">
              <div>
                <h1>设置</h1>
                <p>配置牌局功能及参数</p>
              </div>
            </header>

            <div className="settings-grid">
              <article className="settings-card">
                <div>
                  <h2>初始带入</h2>
                  <p>新建牌局时，每位玩家默认带入的 BB 数量。</p>
                </div>
                <label className="settings-field">
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={store.settings.initialBuyInBB}
                    onChange={(event) => updateSettingsField("initialBuyInBB", event.target.value)}
                    onBlur={(event) => {
                      if (!normalizeBBValue(event.target.value, 0)) {
                        event.currentTarget.value = String(store.settings.initialBuyInBB);
                      }
                    }}
                  />
                  <span>BB</span>
                </label>
              </article>

              <article className="settings-card">
                <div>
                  <h2>补筹档位</h2>
                  <p>牌局详情里显示的两个补筹按钮，修改后只影响之后新增的补筹。</p>
                </div>
                <div className="settings-pair">
                  <label className="settings-field">
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={store.settings.rebuyOptionsBB[0]}
                      onChange={(event) => updateSettingsField("rebuyOption0", event.target.value)}
                      onBlur={(event) => {
                        if (!normalizeBBValue(event.target.value, 0)) {
                          event.currentTarget.value = String(store.settings.rebuyOptionsBB[0]);
                        }
                      }}
                    />
                    <span>BB</span>
                  </label>
                  <label className="settings-field">
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={store.settings.rebuyOptionsBB[1]}
                      onChange={(event) => updateSettingsField("rebuyOption1", event.target.value)}
                      onBlur={(event) => {
                        if (!normalizeBBValue(event.target.value, 0)) {
                          event.currentTarget.value = String(store.settings.rebuyOptionsBB[1]);
                        }
                      }}
                    />
                    <span>BB</span>
                  </label>
                </div>
              </article>

              <article className="settings-card">
                <div>
                  <h2>BB 金额</h2>
                  <p>新建牌局默认使用的 1 BB 对应金额，每场牌局仍可单独修改。</p>
                </div>
                <label className="settings-field">
                  <input
                    type="number"
                    min="1"
                    step="100"
                    value={store.settings.cashPerBB}
                    onChange={(event) => updateSettingsField("cashPerBB", event.target.value)}
                    onBlur={(event) => {
                      if (!normalizeCashValue(event.target.value, 0)) {
                        event.currentTarget.value = String(store.settings.cashPerBB);
                      }
                    }}
                  />
                  <span>金额/BB</span>
                </label>
              </article>
            </div>
          </section>
        )}
          </main>

          <aside className="stats-panel">
        <section className="stats-card player-card">
          <div className="panel-title">
            <h2>玩家统计</h2>
            <div
              className={`select-wrap ${playerMenuOpen ? "open" : ""}`}
              onBlur={(event) => {
                const nextTarget = event.relatedTarget;
                if (!(nextTarget instanceof Node && event.currentTarget.contains(nextTarget))) {
                  setPlayerMenuOpen(false);
                }
              }}
            >
              <button
                type="button"
                className="player-select-button"
                aria-haspopup="listbox"
                aria-expanded={playerMenuOpen}
                onClick={() => setPlayerMenuOpen((open) => !open)}
              >
                <span>{selectedPlayer?.name ?? ""}</span>
              </button>
              <ChevronDown size={16} />
              {playerMenuOpen ? (
                <div className="player-options" role="listbox">
                  {store.players.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      role="option"
                      aria-selected={player.id === selectedPlayerId}
                      className={player.id === selectedPlayerId ? "active" : ""}
                      onClick={() => {
                        setSelectedPlayerId(player.id);
                        setPlayerMenuOpen(false);
                      }}
                    >
                      {player.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
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
            <Stat label="参与牌局" value={String(playerStats.games)} />
            <Stat label="胜率" value={`${playerStats.winRate.toFixed(1)}%`} />
            <Stat label="平均盈利" value={`${formatSigned(playerStats.avgProfit)} BB/局`} hot />
            <Stat label="最大单局盈利" value={`${formatSigned(playerStats.maxProfit)} BB`} hot />
            <Stat label="盈利局数" value={String(playerStats.wins)} />
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

function getCashOutAmount(entry: GameEntry, cashPerBB: number): number | "" {
  if (entry.cashOutAmount !== undefined && entry.cashOutAmount !== "") return entry.cashOutAmount;
  if (entry.cashOutBB === "") return "";
  return Number(entry.cashOutBB) * cashPerBB;
}

function formatNumber(value: number) {
  return value.toLocaleString("zh-CN", { maximumFractionDigits: 3 });
}

function isInTimeFilter(startedAt: string, filter: TimeFilter) {
  if (filter === "all") return true;

  const date = new Date(startedAt);
  const now = new Date();

  if (filter === "today") {
    return date.toDateString() === now.toDateString();
  }

  if (filter === "week") {
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7;
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - day + 1);
    return date.getTime() >= startOfWeek.getTime();
  }

  if (filter === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }

  return true;
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
    games: rows.length,
    wins,
    winRate: rows.length ? (wins / rows.length) * 100 : 0,
    avgProfit: rows.length ? Math.round(totalProfit / rows.length) : 0,
    maxProfit: rows.length ? Math.max(...rows.map((row) => row.profit)) : 0,
    rebuyCount,
    rebuyTotal,
    trend: trend.length ? trend : [{ label: "暂无", value: 0 }]
  };
}

function buildDistribution(games: Game[], playerId: string) {
  const profits = games
    .map((game) => game.entries.find((entry) => entry.playerId === playerId))
    .filter((entry): entry is GameEntry => Boolean(entry))
    .map((entry) => getEntryProfit(entry))
    .filter((profit): profit is number => profit !== null);
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
