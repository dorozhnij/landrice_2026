(function () {
  'use strict';

  const DATA_URL = 'data.json';
  const COLOR_IZHS = '#26CD94';
  const COLOR_SNT = '#BF2543';

  function getChartHeight() {
    return window.matchMedia('(min-width: 768px)').matches ? 220 : 200;
  }

  const priceFormatter = new Intl.NumberFormat('ru-RU');

  const charts = [];
  let dashboardData = null;
  let activeChart = null;
  let resizePending = false;
  let tooltipEl = null;
  let pointerX = 0;
  let pointerY = 0;

  function formatPrice(value) {
    if (value == null || Number.isNaN(value)) {
      return '—';
    }
    return priceFormatter.format(Math.round(value)) + ' ₽/сотка';
  }

  function formatYAxis(value) {
    if (value == null) {
      return '';
    }
    return Math.round(value / 1000) + ' тыс.';
  }

  function createLegend() {
    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    legend.innerHTML =
      '<span class="chart-legend__item">' +
        '<span class="chart-legend__swatch chart-legend__swatch--izhs"></span>ИЖС' +
      '</span>' +
      '<span class="chart-legend__item">' +
        '<span class="chart-legend__swatch chart-legend__swatch--snt"></span>СНТ' +
      '</span>';
    return legend;
  }

  function createTooltipPlugin(regionData) {
    return {
      hooks: {
        setCursor: [
          function (u) {
            const idx = u.cursor.idx;
            if (idx == null || activeChart !== u) {
              return;
            }
            updateTooltip(u, regionData, idx);
          },
        ],
        setSeries: [
          function (u, seriesIdx) {
            if (seriesIdx == null || activeChart !== u) {
              return;
            }
            const idx = u.cursor.idx;
            if (idx != null) {
              updateTooltip(u, regionData, idx);
            }
          },
        ],
      },
    };
  }

  function updateTooltip(u, regionData, idx) {
    if (!tooltipEl) {
      return;
    }

    const izhs = regionData.izhs[idx];
    const snt = regionData.snt[idx];

    if (izhs == null && snt == null) {
      hideTooltip();
      return;
    }

    tooltipEl.innerHTML =
      '<div class="chart-tooltip__month">' + dashboardData.months.full[idx] + '</div>' +
      '<div class="chart-tooltip__row">ИЖС: ' + formatPrice(izhs) + '</div>' +
      '<div class="chart-tooltip__row">СНТ: ' + formatPrice(snt) + '</div>';

    tooltipEl.hidden = false;

    const offset = 14;
    const rect = tooltipEl.getBoundingClientRect();
    let left = pointerX + offset;
    let top = pointerY + offset;

    if (left + rect.width > window.innerWidth - 8) {
      left = pointerX - rect.width - offset;
    }
    if (top + rect.height > window.innerHeight - 8) {
      top = pointerY - rect.height - offset;
    }

    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.hidden = true;
    }
    activeChart = null;
  }

  function bindPointerEvents(u, wrap) {
    const over = u.over;

    over.addEventListener('mouseenter', function () {
      activeChart = u;
    });

    over.addEventListener('mouseleave', function () {
      if (activeChart === u) {
        hideTooltip();
      }
    });

    over.addEventListener('mousemove', function (e) {
      pointerX = e.clientX;
      pointerY = e.clientY;
      activeChart = u;
    });

    function handleTouch(e) {
      if (!e.touches.length) {
        return;
      }
      const touch = e.touches[0];
      const rect = over.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      pointerX = touch.clientX;
      pointerY = touch.clientY;
      activeChart = u;

      u.setCursor({ left: x, top: y });
    }

    over.addEventListener('touchstart', handleTouch, { passive: true });
    over.addEventListener('touchmove', handleTouch, { passive: true });
    over.addEventListener('touchend', function () {
      hideTooltip();
    });
    over.addEventListener('touchcancel', function () {
      hideTooltip();
    });
  }

  function createChart(wrap, regionData) {
    const width = wrap.clientWidth || wrap.parentElement.clientWidth;
    const xIndices = dashboardData.months.xIndices;
    const xLabels = dashboardData.months.short;
    const xData = regionData.izhs.map(function (_, i) {
      return i;
    });

    const isDesktop = window.matchMedia('(min-width: 768px)').matches;

    const opts = {
      width: width,
      height: getChartHeight(),
      cursor: {
        drag: { x: false, y: false },
        focus: { prox: 16 },
      },
      legend: { show: false },
      padding: isDesktop ? [8, 12, 0, 0] : [6, 4, 0, 0],
      scales: {
        x: {
          time: false,
        },
        y: {
          auto: true,
        },
      },
      axes: [
        {
          stroke: '#ccc',
          grid: { show: true, stroke: '#eee', width: 1 },
          ticks: { show: false },
          font: isDesktop ? '11px -apple-system, sans-serif' : '10px -apple-system, sans-serif',
          gap: isDesktop ? 6 : 4,
          splits: function () {
            return xIndices;
          },
          values: function (u, vals) {
            return vals.map(function (v) {
              return xLabels[v];
            });
          },
        },
        {
          stroke: '#ccc',
          grid: { show: true, stroke: '#eee', width: 1 },
          ticks: { show: false },
          font: isDesktop ? '11px -apple-system, sans-serif' : '10px -apple-system, sans-serif',
          size: isDesktop ? 52 : 42,
          gap: 4,
          values: function (u, vals) {
            if (vals.length <= 4) {
              return vals.map(formatYAxis);
            }
            const step = Math.ceil(vals.length / 4);
            return vals
              .filter(function (_, i) {
                return i % step === 0;
              })
              .map(formatYAxis);
          },
        },
      ],
      series: [
        {},
        {
          label: 'ИЖС',
          stroke: COLOR_IZHS,
          width: 2,
          fill: 'transparent',
          spanGaps: false,
        },
        {
          label: 'СНТ',
          stroke: COLOR_SNT,
          width: 2,
          fill: 'transparent',
          spanGaps: false,
        },
      ],
      plugins: [createTooltipPlugin(regionData)],
    };

    const plotData = [
      xData,
      regionData.izhs,
      regionData.snt,
    ];

    const chart = new uPlot(opts, plotData, wrap);
    bindPointerEvents(chart, wrap);

    return {
      chart: chart,
      wrap: wrap,
    };
  }

  function initChart(card) {
    if (card.dataset.initialized === 'true') {
      return;
    }

    const regionIndex = Number(card.dataset.regionIndex);
    const regionData = dashboardData.regions[regionIndex];
    const wrap = card.querySelector('.chart-wrap');
    const entry = createChart(wrap, regionData);

    charts.push(entry);
    card.dataset.initialized = 'true';
    observer.unobserve(card);
  }

  function buildChartCards(grid) {
    dashboardData.regions.forEach(function (region, index) {
      const card = document.createElement('article');
      card.className = 'chart-card';
      card.dataset.regionIndex = String(index);

      const title = document.createElement('h3');
      title.className = 'chart-card__title';
      title.textContent = region.name;

      const wrap = document.createElement('div');
      wrap.className = 'chart-wrap';

      card.appendChild(title);
      card.appendChild(wrap);
      card.appendChild(createLegend());
      grid.appendChild(card);

      observer.observe(card);
    });
  }

  function resizeCharts() {
    charts.forEach(function (entry) {
      const width = entry.wrap.clientWidth;
      if (width > 0) {
        entry.chart.setSize({ width: width, height: getChartHeight() });
      }
    });
    resizePending = false;
  }

  function scheduleResize() {
    if (resizePending) {
      return;
    }
    resizePending = true;
    requestAnimationFrame(resizeCharts);
  }

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          initChart(entry.target);
        }
      });
    },
    { rootMargin: '200px' }
  );

  const resizeObserver = new ResizeObserver(scheduleResize);

  function initTopbar() {
    const toggle = document.querySelector('.topbar__toggle');
    const nav = document.getElementById('topbar-nav');
    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    nav.querySelectorAll('.topbar__link').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  async function init() {
    initTopbar();
    tooltipEl = document.getElementById('chart-tooltip');
    const grid = document.getElementById('charts-grid');

    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error('Failed to load ' + DATA_URL);
    }

    dashboardData = await response.json();
    buildChartCards(grid);
    resizeObserver.observe(grid);

    window.addEventListener('resize', scheduleResize);
    document.addEventListener('scroll', hideTooltip, { passive: true });
  }

  init().catch(function (err) {
    console.error(err);
    const grid = document.getElementById('charts-grid');
    if (grid) {
      grid.innerHTML = '<p>Не удалось загрузить данные графиков.</p>';
    }
  });
})();
