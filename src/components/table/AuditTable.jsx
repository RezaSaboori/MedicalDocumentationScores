import React, {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { formatPercent } from '../../utils/formatters';
import {
  DASHBOARD_MODES,
  PDI_THRESHOLD,
} from '../../utils/constants';
import { Skeleton } from '../ui/Skeleton';
import './AuditTable.css';

const formatFixed = (value, digits) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number.toFixed(digits)
    : '—';
};

const createColumns = (showYearColumn) => {
  const columns = [
    {
      key: 'name',
      label: 'نام',
      sortKey: 'name',
      width: 360,
      className: 'audit-table__cell--name',
      render: (row) => (
        <span
          className="audit-table__name-text"
          title={row.name}
        >
          {row.name}
        </span>
      ),
    },
  ];

  if (showYearColumn) {
    columns.push({
      key: 'year',
      label: 'سال',
      sortKey: 'year',
      width: 80,
      render: (row) => row.year ?? '—',
    });
  }

  columns.push(
    {
      key: 'group',
      label: 'گروه',
      sortKey: 'group_fa',
      width: 150,
      render: (row) => (
        <span
          className="audit-table__ellipsis audit-table__group"
          title={row.group_fa}
          style={{
            '--audit-group-color':
              row.group_color || 'var(--color-gray7)',
          }}
        >
          {row.group_fa}
        </span>
      ),
    },
    {
      key: 'visits',
      label: 'ویزیت',
      sortKey: 'V',
      width: 90,
      render: (row) => row.V,
    },
    {
      key: 'empty-rate',
      label: 'نرخ خالی',
      sortKey: 'rho_Z',
      width: 110,
      render: (row) => formatPercent(row.rho_Z),
    },
    {
      key: 'pdi',
      label: 'امتیاز کیفیت ثبت پرونده‌ها',
      sortKey: 'PDI',
      width: 170,
      render: (row) => formatFixed(row.PDI, 1),
    },
    {
      key: 'status',
      label: 'وضعیت',
      width: 160,
      className: 'audit-table__cell--status',
      render: (row) => {
        const isAcceptable =
          Number(row.PDI) >= PDI_THRESHOLD;

        return (
          <span
            className="audit-table__status"
            style={{
              '--audit-status-color':
                isAcceptable
                  ? 'var(--color-green)'
                  : 'var(--color-red)',
            }}
          >
            <span
              className="audit-table__status-dot"
              aria-hidden="true"
            />

            <span>
              {isAcceptable
                ? 'مطلوب'
                : 'نیازمند بهبود'}
            </span>
          </span>
        );
      },
    },
    {
      key: 'calibrated-score',
      label: 'میانگین نمرات پرونده‌ها - کالیبره‌شده',
      sortKey: 'calibrated_score',
      width: 180,
      render: (row) =>
        formatFixed(row.calibrated_score, 2),
    },
    {
      key: 'raw-score',
      label: 'میانگین نمرات پرونده‌ها - خام',
      sortKey: 'raw_score',
      width: 160,
      render: (row) =>
        formatFixed(row.raw_score, 2),
    },
    {
      key: 'adjusted-quality',
      label: 'کیفیت تعدیل‌شده',
      sortKey: 'WQS_adj',
      width: 140,
      render: (row) =>
        formatFixed(row.WQS_adj, 2),
    },
    {
      key: 'laq',
      label: 'LAQ',
      sortKey: 'LAQ',
      width: 100,
      render: (row) =>
        formatFixed(row.LAQ, 2),
    },
  );

  return columns;
};

const AuditTable = () => {
  const {
    data,
    loading,
    mode,
  } = useDashboard();

  const tableRef = useRef(null);
  const horizontalScrollRef = useRef(null);

  const [sortConfig, setSortConfig] =
    useState({
      key: 'PDI',
      direction: 'desc',
    });

  const showYearColumn =
    mode === DASHBOARD_MODES.RESIDENTS;

  const columns = useMemo(
    () =>
      createColumns(
        showYearColumn
      ),
    [showYearColumn]
  );

  /*
   * The visual track is rendered from left to right,
   * while the logical table order remains RTL:
   *
   * right:
   * name → year → group → ... → LAQ
   *
   * left:
   * LAQ → ... → name
   */
  const trackColumns = useMemo(
    () =>
      [...columns].reverse(),
    [columns]
  );

  const trackWidth = useMemo(
    () =>
      trackColumns.reduce(
        (sum, column) =>
          sum + column.width,
        0
      ),
    [trackColumns]
  );

  const gridTemplate = useMemo(
    () =>
      trackColumns
        .map(
          (column) =>
            `${column.width}px`
        )
        .join(' '),
    [trackColumns]
  );

  const sortedData = useMemo(() => {
    if (!data.current) {
      return [];
    }

    return [...data.current].sort(
      (a, b) => {
        if (
          a[sortConfig.key] <
          b[sortConfig.key]
        ) {
          return sortConfig.direction ===
            'asc'
            ? -1
            : 1;
        }

        if (
          a[sortConfig.key] >
          b[sortConfig.key]
        ) {
          return sortConfig.direction ===
            'asc'
            ? 1
            : -1;
        }

        return 0;
      }
    );
  }, [
    data,
    sortConfig,
  ]);

  const handleSort = (key) => {
    setSortConfig((previous) => ({
      key,
      direction:
        previous.key === key &&
        previous.direction === 'desc'
          ? 'asc'
          : 'desc',
    }));
  };

  const handleHorizontalScroll = (
    event
  ) => {
    if (!tableRef.current) {
      return;
    }

    tableRef.current.style.setProperty(
      '--audit-scroll-x',
      `${event.currentTarget.scrollLeft}px`
    );
  };

  /*
   * Start from the RTL side of the data:
   * name/year/group are visible first.
   */
  useLayoutEffect(() => {
    const scrollElement =
      horizontalScrollRef.current;

    if (!scrollElement) {
      return undefined;
    }

    const frame =
      requestAnimationFrame(
        () => {
          scrollElement.scrollLeft =
            Math.max(
              0,
              scrollElement.scrollWidth -
                scrollElement.clientWidth
            );

          handleHorizontalScroll({
            currentTarget:
              scrollElement,
          });
        }
      );

    return () =>
      cancelAnimationFrame(
        frame
      );
  }, [
    trackWidth,
  ]);

  const tableStyle = {
    '--audit-track-width':
      `${trackWidth}px`,

    '--audit-grid-columns':
      gridTemplate,
  };

  return (
    <section className="glass u-container u-container--md audit-panel">
      <div className="audit-panel__body">
        <div
          ref={tableRef}
          className="audit-table"
          style={tableStyle}
          role="table"
        >
          <div
            className="audit-table__row audit-table__row--header"
            role="row"
          >
            <div className="audit-table__row-viewport">
              <div className="audit-table__track">
                {trackColumns.map(
                  (column) => (
                    <div
                      key={column.key}
                      className={`audit-table__cell audit-table__header-cell ${
                        column.className || ''
                      }`}
                      role="columnheader"
                    >
                      {column.sortKey ? (
                        <button
                          type="button"
                          className="audit-table__sort-button"
                          onClick={() =>
                            handleSort(
                              column.sortKey
                            )
                          }
                        >
                          {column.label}
                        </button>
                      ) : (
                        <span>
                          {column.label}
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            <div
              className="audit-table__index-cell"
              role="columnheader"
            >
              ردیف
            </div>
          </div>

          <div className="audit-table__rows">
            {loading &&
              Array.from({
                length: 10,
              }).map((_, rowIndex) => (
                <div
                  key={`skeleton-${rowIndex}`}
                  className="audit-table__row"
                  role="row"
                >
                  <div className="audit-table__row-viewport">
                    <div className="audit-table__track">
                      {trackColumns.map(
                        (column) => (
                          <div
                            key={column.key}
                            className="audit-table__cell"
                            role="cell"
                          >
                            <Skeleton
                              width="70%"
                              height="0.9rem"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div
                    className="audit-table__index-cell"
                    role="cell"
                  >
                    <Skeleton
                      width="40%"
                      height="0.9rem"
                    />
                  </div>
                </div>
              ))}

            {!loading &&
              sortedData.map(
                (row, rowIndex) => (
                  <div
                    key={
                      row.id ??
                      row.name ??
                      rowIndex
                    }
                    className="audit-table__row"
                    role="row"
                  >
                    <div className="audit-table__row-viewport">
                      <div className="audit-table__track">
                        {trackColumns.map(
                          (column) => (
                            <div
                              key={
                                column.key
                              }
                              className={`audit-table__cell ${
                                column.className ||
                                ''
                              }`}
                              role="cell"
                            >
                              {column.render(
                                row
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div
                      className="audit-table__index-cell"
                      role="cell"
                    >
                      {rowIndex + 1}
                    </div>
                  </div>
                )
              )}
          </div>

          <div
            ref={horizontalScrollRef}
            className="audit-table__horizontal-scroll"
            onScroll={
              handleHorizontalScroll
            }
            aria-label="پیمایش افقی جدول"
          >
            <div className="audit-table__horizontal-spacer" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuditTable;