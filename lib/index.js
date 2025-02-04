// src/leetcode.ts
import EventEmitter2 from "eventemitter3";

// src/cache.ts
var Cache = class {
  constructor() {
    this._table = {};
  }
  /**
   * Get an item from the cache.
   * @param key The key of the item.
   * @returns {any} The item, or null if it doesn't exist.
   */
  get(key) {
    const item = this._table[key];
    if (item) {
      if (item.expires > Date.now()) {
        return item.value;
      }
      this.remove(key);
    }
    return null;
  }
  /**
   * Set an item in the cache.
   * @param key The key of the item.
   * @param value The value of the item.
   * @param expires The time in milliseconds until the item expires.
   */
  set(key, value, expires = 6e4) {
    this._table[key] = {
      key,
      value,
      expires: expires > 0 ? Date.now() + expires : 0
    };
  }
  /**
   * Remove an item from the cache.
   * @param key The key of the item.
   */
  remove(key) {
    delete this._table[key];
  }
  /**
   * Clear the cache.
   */
  clear() {
    this._table = {};
  }
  /**
   * Load the cache from a JSON string.
   * @param json A {@link CacheTable}-like JSON string.
   */
  load(json) {
    this._table = JSON.parse(json);
  }
};
var cache = new Cache();
var caches = { default: cache };

// src/constants.ts
var BASE_URL = "https://leetcode.com";
var BASE_URL_CN = "https://leetcode.cn";
var USER_AGENT = "'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";



// src/fetch.ts
import { useCrossFetch } from "@fetch-impl/cross-fetch";
import { Fetcher } from "@fetch-impl/fetcher";
var fetcher = new Fetcher();
useCrossFetch(fetcher);
var _fetch = (...args) => fetcher.fetch(...args);
var fetch_default = _fetch;

// src/utils.ts
function parse_cookie(cookie) {
  return cookie.split(";").map((x) => x.trim().split("=")).reduce(
    (acc, x) => {
      acc[x[0]] = x[1];
      return acc;
    },
    {}
  );
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// src/credential.ts
async function get_csrf() {
  const cookies_raw = await fetch_default(BASE_URL, {
    headers: {
      "user-agent": USER_AGENT
    }
  }).then((res) => res.headers.get("set-cookie"));
  if (!cookies_raw) {
    return void 0;
  }
  const csrf_token = parse_cookie(cookies_raw).csrftoken;
  return csrf_token;
}
var Credential = class {
  constructor(data) {
    if (data) {
      this.session = data.session;
      this.csrf = data.csrf;
    }
  }
  /**
   * Init the credential with or without leetcode session cookie.
   * @param session
   * @returns
   */
  async init(session) {
    this.csrf = await get_csrf();
    if (session)
      this.session = session;
    return this;
  }
};

// src/graphql/contest.graphql?raw
var contest_default = "query ($username: String!) {\n    userContestRanking(username: $username) {\n        attendedContestsCount\n        rating\n        globalRanking\n        totalParticipants\n        topPercentage\n        badge {\n            name\n        }\n    }\n    userContestRankingHistory(username: $username) {\n        attended\n        trendDirection\n        problemsSolved\n        totalProblems\n        finishTimeInSeconds\n        rating\n        ranking\n        contest {\n            title\n            startTime\n        }\n    }\n}\n";

// src/graphql/daily.graphql?raw
var daily_default = "query {\n    activeDailyCodingChallengeQuestion {\n        date\n        link\n        question {\n            questionId\n            questionFrontendId\n            boundTopicId\n            title\n            titleSlug\n            content\n            translatedTitle\n            translatedContent\n            isPaidOnly\n            difficulty\n            likes\n            dislikes\n            isLiked\n            similarQuestions\n            exampleTestcases\n            contributors {\n                username\n                profileUrl\n                avatarUrl\n            }\n            topicTags {\n                name\n                slug\n                translatedName\n            }\n            companyTagStats\n            codeSnippets {\n                lang\n                langSlug\n                code\n            }\n            stats\n            hints\n            solution {\n                id\n                canSeeDetail\n                paidOnly\n                hasVideoSolution\n                paidOnlyVideo\n            }\n            status\n            sampleTestCase\n            metaData\n            judgerAvailable\n            judgeType\n            mysqlSchemas\n            enableRunCode\n            enableTestMode\n            enableDebugger\n            envInfo\n            libraryUrl\n            adminUrl\n            challengeQuestion {\n                id\n                date\n                incompleteChallengeCount\n                streakCount\n                type\n            }\n            note\n        }\n    }\n}\n";

// src/graphql/problem.graphql?raw
var problem_default = "query ($titleSlug: String!) {\n    question(titleSlug: $titleSlug) {\n        questionId\n        questionFrontendId\n        boundTopicId\n        title\n        titleSlug\n        content\n        translatedTitle\n        translatedContent\n        isPaidOnly\n        difficulty\n        likes\n        dislikes\n        isLiked\n        similarQuestions\n        exampleTestcases\n        contributors {\n            username\n            profileUrl\n            avatarUrl\n        }\n        topicTags {\n            name\n            slug\n            translatedName\n        }\n        companyTagStats\n        codeSnippets {\n            lang\n            langSlug\n            code\n        }\n        stats\n        hints\n        solution {\n            id\n            canSeeDetail\n            paidOnly\n            hasVideoSolution\n            paidOnlyVideo\n        }\n        status\n        sampleTestCase\n        metaData\n        judgerAvailable\n        judgeType\n        mysqlSchemas\n        enableRunCode\n        enableTestMode\n        enableDebugger\n        envInfo\n        libraryUrl\n        adminUrl\n        challengeQuestion {\n            id\n            date\n            incompleteChallengeCount\n            streakCount\n            type\n        }\n        note\n    }\n}\n";

// src/graphql/problems.graphql?raw
var problems_default = "query ($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {\n    problemsetQuestionList: questionList(\n        categorySlug: $categorySlug\n        limit: $limit\n        skip: $skip\n        filters: $filters\n    ) {\n        total: totalNum\n        questions: data {\n            acRate\n            difficulty\n            freqBar\n            questionFrontendId\n            isFavor\n            isPaidOnly\n            status\n            title\n            titleSlug\n            topicTags {\n                name\n                id\n                slug\n            }\n            hasSolution\n            hasVideoSolution\n        }\n    }\n}\n";

// src/graphql/profile.graphql?raw
var profile_default = "query ($username: String!) {\n    allQuestionsCount {\n        difficulty\n        count\n    }\n    matchedUser(username: $username) {\n        username\n        socialAccounts\n        githubUrl\n        contributions {\n            points\n            questionCount\n            testcaseCount\n        }\n        profile {\n            realName\n            websites\n            countryName\n            skillTags\n            company\n            school\n            starRating\n            aboutMe\n            userAvatar\n            reputation\n            ranking\n        }\n        submissionCalendar\n        submitStats {\n            acSubmissionNum {\n                difficulty\n                count\n                submissions\n            }\n            totalSubmissionNum {\n                difficulty\n                count\n                submissions\n            }\n        }\n        badges {\n            id\n            displayName\n            icon\n            creationDate\n        }\n        upcomingBadges {\n            name\n            icon\n        }\n        activeBadge {\n            id\n        }\n    }\n    recentSubmissionList(username: $username, limit: 20) {\n        title\n        titleSlug\n        timestamp\n        statusDisplay\n        lang\n    id\n}\n}\n";

// src/graphql/recent-submissions.graphql?raw
var recent_submissions_default = "query ($username: String!, $limit: Int) {\n    recentSubmissionList(username: $username, limit: $limit) {\n        title\n        titleSlug\n        timestamp\n        statusDisplay\n        lang\n    id\n}\n}\n";

// src/graphql/submissions.graphql?raw
var submissions_default = "query ($offset: Int!, $limit: Int!, $slug: String) {\n    submissionList(offset: $offset, limit: $limit, questionSlug: $slug) {\n        hasNext\n        submissions {\n            id\n            lang\n            time\n            timestamp\n            statusDisplay\n            runtime\n            url\n            isPending\n            title\n            memory\n            titleSlug\n        }\n    }\n}\n";

// src/graphql/whoami.graphql?raw
var whoami_default = "query {\n    userStatus {\n        userId\n        username\n        avatar\n        isSignedIn\n        isMockUser\n        isPremium\n        isAdmin\n        isSuperuser\n        isTranslator\n        permissions\n    }\n}\n";

// src/mutex.ts
import EventEmitter from "eventemitter3";
var Mutex = class extends EventEmitter {
  constructor(space = 1) {
    super();
    this.space = space;
    this.used = 0;
    this.releases = [];
  }
  async lock() {
    if (this.used >= this.space) {
      const lock = new Promise((r) => this.releases.push(r));
      this.emit("wait", {
        lock,
        release: this.releases[this.releases.length - 1]
      });
      await lock;
    }
    this.used++;
    this.emit("lock");
    return this.used;
  }
  unlock() {
    if (this.used <= 0) {
      return 0;
    }
    if (this.releases.length > 0) {
      this.releases.shift()?.();
    }
    this.used--;
    this.emit("unlock");
    if (this.used <= 0) {
      this.emit("all-clear");
    }
    return this.used;
  }
  resize(space) {
    this.space = space;
    while (this.used < space && this.releases.length > 0) {
      this.releases.shift()?.();
    }
    return this.space;
  }
  full() {
    return this.used >= this.space;
  }
  waiting() {
    return this.releases.length;
  }
  emit(event, ...args) {
    return super.emit(event, ...args);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event, listener) {
    return super.on(event, listener);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  once(event, listener) {
    return super.once(event, listener);
  }
};
var RateLimiter = class extends Mutex {
  constructor({ limit = 20, interval = 1e4, concurrent = 2 } = {}) {
    super(concurrent);
    this.count = 0;
    this.last = 0;
    this.time_mutex = new Mutex(limit);
    this.interval = interval;
    this.time_mutex.on("lock", (...args) => this.emit("time-lock", ...args));
    this.time_mutex.on("unlock", (...args) => this.emit("time-unlock", ...args));
  }
  async lock() {
    if (this.last + this.interval < Date.now()) {
      this.reset();
    } else if (this.time_mutex.full() && !this.timer) {
      this.cleaner();
    }
    await this.time_mutex.lock();
    this.count++;
    return super.lock();
  }
  reset() {
    while (this.count > 0) {
      this.time_mutex.unlock();
      this.count--;
    }
    this.last = Date.now();
    this.emit("timer-reset");
  }
  cleaner() {
    this.timer = setTimeout(
      () => {
        this.reset();
        setTimeout(() => {
          if (this.time_mutex.waiting() > 0) {
            this.cleaner();
          } else {
            this.timer = void 0;
          }
        }, 0);
      },
      this.last + this.interval - Date.now()
    );
  }
  set limit(limit) {
    this.time_mutex.resize(limit);
  }
  emit(event, ...args) {
    return super.emit(event, ...args);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event, listener) {
    return super.on(event, listener);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  once(event, listener) {
    return super.once(event, listener);
  }
};

// src/leetcode.ts
var LeetCode = class extends EventEmitter2 {
  /**
   * If a credential is provided, the LeetCode API will be authenticated. Otherwise, it will be anonymous.
   * @param credential
   * @param cache
   */
  constructor(credential = null, cache2 = cache) {
    super();
    /**
     * Rate limiter
     */
    this.limiter = new RateLimiter();
    let initialize;
    this.initialized = new Promise((resolve) => {
      initialize = resolve;
    });
    this.cache = cache2;
    if (credential) {
      this.credential = credential;
      setImmediate(() => initialize());
    } else {
      this.credential = new Credential();
      this.credential.init().then(() => initialize());
    }
  }
  /**
   * Get public profile of a user.
   * @param username
   * @returns
   *
   * ```javascript
   * const leetcode = new LeetCode();
   * const profile = await leetcode.user("jacoblincool");
   * ```
   */
  async user(username) {
    await this.initialized;
    const { data } = await this.graphql({
      variables: { username },
      query: profile_default
    });
    return data;
  }
  /**
   * Get public contest info of a user.
   * @param username
   * @returns
   *
   * ```javascript
   * const leetcode = new LeetCode();
   * const profile = await leetcode.user_contest_info("jacoblincool");
   * ```
   */
  async user_contest_info(username) {
    await this.initialized;
    const { data } = await this.graphql({
      variables: { username },
      query: contest_default
    });
    return data;
  }
  /**
   * Get recent submissions of a user. (max: 20 submissions)
   * @param username
   * @param limit
   * @returns
   *
   * ```javascript
   * const leetcode = new LeetCode();
   * const submissions = await leetcode.recent_submissions("jacoblincool");
   * ```
   */
  async recent_submissions(username, limit = 20) {
    await this.initialized;
    const { data } = await this.graphql({
      variables: { username, limit },
      query: recent_submissions_default
    });
    return data.recentSubmissionList || [];
  }
  /**
   * Get submissions of the credential user. Need to be authenticated.
   *
   * @returns
   *
   * ```javascript
   * const credential = new Credential();
   * await credential.init("SESSION");
   * const leetcode = new LeetCode(credential);
   * const submissions = await leetcode.submissions({ limit: 100, offset: 0 });
   * ```
   */
  async submissions({
    limit = 20,
    offset = 0,
    slug
  } = {}) {
    await this.initialized;
    const submissions = [];
    const set = /* @__PURE__ */ new Set();
    let cursor = offset;
    while (submissions.length < limit) {
      const { data } = await this.graphql({
        variables: {
          offset: cursor,
          limit: limit - submissions.length > 20 ? 20 : limit - submissions.length,
          slug
        },
        query: submissions_default
      });
      for (const submission of data.submissionList.submissions) {
        submission.id = parseInt(submission.id, 10);
        submission.timestamp = parseInt(submission.timestamp, 10) * 1e3;
        submission.isPending = submission.isPending !== "Not Pending";
        submission.runtime = parseInt(submission.runtime, 10) || 0;
        submission.memory = parseFloat(submission.memory) || 0;
        if (set.has(submission.id)) {
          continue;
        }
        set.add(submission.id);
        submissions.push(submission);
      }
      if (!data.submissionList.hasNext) {
        break;
      }
      cursor += 20;
    }
    return submissions;
  }
  /**
   * Get detail of a submission, including the code and percentiles.
   * Need to be authenticated.
   * @param id Submission ID
   * @returns
   */
  async submission(id) {
    await this.initialized;
    
    const retryLimit = 13;
    let attempt = 0;
  
    while (attempt < retryLimit) {
      try {
        await this.limiter.lock();
  
        const res = await fetch_default(`${BASE_URL}/submissions/detail/${id}/`, {
          headers: {
            origin: BASE_URL,
            referer: BASE_URL,
            cookie: `csrftoken=${this.credential.csrf || ""}; LEETCODE_SESSION=${this.credential.session || ""};`,
            "user-agent": USER_AGENT
          }
        });
  
        const raw = await res.text();
        const data = raw.match(/var pageData = ({[^]+?});/)?.[1];
  
        if (!data) {
          throw new Error('Failed to extract data from response');
        }
  
        const json = new Function("return " + data)();
  
        if (!json.submissionId || !json.questionId) {
          throw new Error('Missing required fields in JSON response');
        }
  
        const result = {
          id: parseInt(json.submissionId),
          problem_id: parseInt(json.questionId),
          runtime: parseInt(json.runtime),
          runtime_distribution: json.runtimeDistributionFormatted ? JSON.parse(json.runtimeDistributionFormatted).distribution.map(
            (item) => [+item[0], item[1]]
          ) : [],
          runtime_percentile: 0,
          memory: parseInt(json.memory),
          memory_distribution: json.memoryDistributionFormatted ? JSON.parse(json.memoryDistributionFormatted).distribution.map(
            (item) => [+item[0], item[1]]
          ) : [],
          memory_percentile: 0,
          code: json.submissionCode,
          details: json.submissionData
        };
  
        result.runtime_percentile = result.runtime_distribution.reduce(
          (acc, [usage, p]) => acc + (usage >= result.runtime ? p : 0),
          0
        );
  
        result.memory_percentile = result.memory_distribution.reduce(
          (acc, [usage, p]) => acc + (usage >= result.memory / 1e3 ? p : 0),
          0
        );
  
        this.limiter.unlock();
        return result;
  
      } catch (err) {
        attempt++;
        console.error(`Attempt ${attempt} failed: ${err.message}`);
        this.limiter.unlock();
        
        if (attempt >= retryLimit) {
          throw new Error('Max retry limit reached. Unable to fetch submission data.');
        }
        
        // Exponential backoff
        
      }
    }
  }
  
  /**
   * Get a list of problems by tags and difficulty.
   * @param option
   * @param option.category
   * @param option.offset
   * @param option.limit
   * @param option.filters
   * @returns
   */
  async problems({
    category = "",
    offset = 0,
    limit = 100,
    filters = {}
  } = {}) {
    await this.initialized;
    const variables = { categorySlug: category, skip: offset, limit, filters };
    const { data } = await this.graphql({
      variables,
      query: problems_default
    });
    return data.problemsetQuestionList;
  }
  /**
   * Get information of a problem by its slug.
   * @param slug Problem slug
   * @returns
   *
   * ```javascript
   * const leetcode = new LeetCode();
   * const problem = await leetcode.problem("two-sum");
   * ```
   */
  async problem(slug) {
    await this.initialized;
    const { data } = await this.graphql({
      variables: { titleSlug: slug.toLowerCase().replace(/\s/g, "-") },
      query: problem_default
    });
    return data.question;
  }
  /**
   * Get daily challenge.
   * @returns
   *
   * @example
   * ```javascript
   * const leetcode = new LeetCode();
   * const daily = await leetcode.daily();
   * ```
   */
  async daily() {
    await this.initialized;
    const { data } = await this.graphql({
      query: daily_default
    });
    return data.activeDailyCodingChallengeQuestion;
  }
  /**
   * Check the information of the credential owner.
   * @returns
   */
  async whoami() {
    await this.initialized;
    const { data } = await this.graphql({
      operationName: "globalData",
      variables: {},
      query: whoami_default
    });
    return data.userStatus;
  }
  /**
   * Use GraphQL to query LeetCode API.
   * @param query
   * @returns
   */
  async graphql(query) {
    await this.initialized;
    try {
      await this.limiter.lock();
      const BASE = BASE_URL;
      const res = await fetch_default(`${BASE}/graphql`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: BASE,
          referer: BASE,
          cookie: `csrftoken=${this.credential.csrf || ""}; LEETCODE_SESSION=${this.credential.session || ""};`,
          "x-csrftoken": this.credential.csrf || "",
          "user-agent": USER_AGENT,
          ...query.headers
        },
        body: JSON.stringify(query)
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${await res.text()}`);
      }
      this.emit("receive-graphql", res);
      if (res.headers.has("set-cookie")) {
        const cookies = parse_cookie(res.headers.get("set-cookie") || "");
        if (cookies["csrftoken"]) {
          this.credential.csrf = cookies["csrftoken"];
          this.emit("update-csrf", this.credential);
        }
      }
      this.limiter.unlock();
      return res.json();
    } catch (err) {
      this.limiter.unlock();
      throw err;
    }
  }
  emit(event, ...args) {
    return super.emit(event, ...args);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event, listener) {
    return super.on(event, listener);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  once(event, listener) {
    return super.once(event, listener);
  }
};
var leetcode_default = LeetCode;

// src/leetcode-cn.ts
import EventEmitter3 from "eventemitter3";

// src/credential-cn.ts
async function get_csrf2() {
  const res = await fetch_default(`${BASE_URL_CN}/graphql/`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": USER_AGENT
    },
    body: JSON.stringify({
      operationName: "nojGlobalData",
      variables: {},
      query: "query nojGlobalData {\n  siteRegion\n  chinaHost\n  websocketUrl\n}\n"
    })
  });
  const cookies_raw = res.headers.get("set-cookie");
  if (!cookies_raw) {
    return void 0;
  }
  const csrf_token = parse_cookie(cookies_raw).csrftoken;
  return csrf_token;
}
var Credential2 = class {
  constructor(data) {
    if (data) {
      this.session = data.session;
      this.csrf = data.csrf;
    }
  }
  /**
   * Init the credential with or without leetcode session cookie.
   * @param session
   * @returns
   */
  async init(session) {
    this.csrf = await get_csrf2();
    if (session)
      this.session = session;
    return this;
  }
};

// src/leetcode-cn.ts
var LeetCodeCN = class extends EventEmitter3 {
  /**
   * If a credential is provided, the LeetCodeCN API will be authenticated. Otherwise, it will be anonymous.
   * @param credential
   * @param cache
   */
  constructor(credential = null, cache2 = cache) {
    super();
    /**
     * Rate limiter
     */
    this.limiter = new RateLimiter();
    let initialize;
    this.initialized = new Promise((resolve) => {
      initialize = resolve;
    });
    this.cache = cache2;
    if (credential) {
      this.credential = credential;
      setImmediate(() => initialize());
    } else {
      this.credential = new Credential2();
      this.credential.init().then(() => initialize());
    }
  }
  /**
   * Get public profile of a user.
   * @param username
   * @returns
   *
   * ```javascript
   * const leetcode = new LeetCodeCN();
   * const profile = await leetcode.user("jacoblincool");
   * ```
   */
  async user(username) {
    await this.initialized;
    const { data } = await this.graphql({
      operationName: "getUserProfile",
      variables: { username },
      query: `
            query getUserProfile($username: String!) {
                userProfileUserQuestionProgress(userSlug: $username) {
                    numAcceptedQuestions { difficulty count }
                    numFailedQuestions { difficulty count }
                    numUntouchedQuestions { difficulty count }
                }
                userProfilePublicProfile(userSlug: $username) {
                    username haveFollowed siteRanking
                    profile { 
                        userSlug realName aboutMe userAvatar location gender websites skillTags contestCount asciiCode
                        medals { name year month category }
                        ranking { 
                            currentLocalRanking currentGlobalRanking currentRating totalLocalUsers totalGlobalUsers
                        }
                        socialAccounts { provider profileUrl }
                    }
                }
            }
            `
    });
    return data;
  }
  /**
   * Use GraphQL to query LeetCodeCN API.
   * @param query
   * @param endpoint Maybe you want to use `/graphql/noj-go/` instead of `/graphql/`.
   * @returns
   */
  async graphql(query, endpoint = "/graphql/") {
    await this.initialized;
    try {
      await this.limiter.lock();
      const BASE = BASE_URL_CN;
      const res = await fetch_default(`${BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: BASE,
          referer: BASE,
          cookie: `csrftoken=${this.credential.csrf || ""}; LEETCODE_SESSION=${this.credential.session || ""};`,
          "x-csrftoken": this.credential.csrf || "",
          "user-agent": USER_AGENT,
          ...query.headers
        },
        body: JSON.stringify(query)
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${await res.text()}`);
      }
      this.emit("receive-graphql", res);
      if (res.headers.has("set-cookie")) {
        const cookies = parse_cookie(res.headers.get("set-cookie") || "");
        if (cookies["csrftoken"]) {
          this.credential.csrf = cookies["csrftoken"];
          this.emit("update-csrf", this.credential);
        }
      }
      this.limiter.unlock();
      return res.json();
    } catch (err) {
      this.limiter.unlock();
      throw err;
    }
  }
  emit(event, ...args) {
    return super.emit(event, ...args);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event, listener) {
    return super.on(event, listener);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  once(event, listener) {
    return super.once(event, listener);
  }
};
var leetcode_cn_default = LeetCodeCN;

// src/index.ts
var src_default = leetcode_default;
export {
  BASE_URL,
  BASE_URL_CN,
  Cache,
  Credential,
  leetcode_default as LeetCode,
  leetcode_cn_default as LeetCodeCN,
  Mutex,
  RateLimiter,
  USER_AGENT,
  _fetch,
  cache,
  caches,
  src_default as default,
  _fetch as fetch,
  fetcher
};
