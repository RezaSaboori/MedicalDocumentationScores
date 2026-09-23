import React, {
  useEffect,
  useState,
} from 'react';
import {
  fetchPhysicianTrend,
} from '../../services/dataService';
import {
  useDashboard,
} from '../../context/DashboardContext';
import {
  flagGroupColor,
  flagGroupLabel,
} from '../../utils/flagGroups';
import {
  PDI_THRESHOLD,
} from '../../utils/constants';
import {
  toPersianDigits,
} from '../../utils/period';
import PhysicianScoreTrendChart from '../charts/PhysicianScoreTrendChart';
import PhysicianDocumentationBubbleChart from '../charts/PhysicianDocumentationBubbleChart';
import PhysicianTrendKpiCards from '../kpis/PhysicianTrendKpiCards';
import './PhysicianTrendModal.css';

const PhysicianTrendModal = ({
  physician,
  onClose,
}) => {
  const {
    selectedPeriod,
  } = useDashboard();

  const [
    trendData,
    setTrendData,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);

  const visible =
    Boolean(
      physician?.name &&
      physician?.category
    );

  useEffect(() => {
    if (!visible) {
      setTrendData([]);
      setError(null);
      return undefined;
    }

    let active = true;

    setLoading(true);
    setError(null);

    fetchPhysicianTrend(
      physician.category,
      physician.name
    )
      .then((rows) => {
        if (!active) {
          return;
        }

        const normalizedRows =
          rows.map(
            (row) => {
              const visits =
                Number(row.V);

              const documented =
                Number(row.D);

              const documentationRatio =
                row.row_id !==
                  null &&
                Number.isFinite(
                  visits
                ) &&
                visits > 0 &&
                Number.isFinite(
                  documented
                )
                  ? Math.min(
                      1,
                      Math.max(
                        0,
                        documented /
                          visits
                      )
                    )
                  : null;

              const hasRow =
                row.row_id !==
                null;

              return {
                ...row,

                documentation_ratio:
                  documentationRatio,

                group_fa:
                  hasRow
                    ? flagGroupLabel(
                        row.flags
                      )
                    : null,

                group_color:
                  hasRow
                    ? flagGroupColor(
                        row.flags
                      )
                    : null,
              };
            }
          );

        setTrendData(
          normalizedRows
        );
      })
      .catch((err) => {
        if (!active) {
          return;
        }

        setTrendData([]);

        setError(
          err.message ||
            'خطا در دریافت روند پزشک'
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    visible,
    physician?.category,
    physician?.name,
  ]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    const handleKeyDown = (
      event
    ) => {
      if (
        event.key ===
        'Escape'
      ) {
        onClose();
      }
    };

    document.body.style.overflow =
      'hidden';

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    visible,
    onClose,
  ]);

  if (!visible) {
    return null;
  }

  const hasData =
    trendData.some(
      (row) =>
        row.row_id !== null
    );

  const selectedPeriodRow =
    trendData.find(
      (row) =>
        row.period ===
          selectedPeriod &&
        row.row_id !== null
    ) || null;

  const residentYear =
    selectedPeriodRow?.category ===
      'resident' &&
    selectedPeriodRow?.resident_year !==
      null &&
    selectedPeriodRow?.resident_year !==
      undefined &&
    String(
      selectedPeriodRow.resident_year
    ).trim() !== ''
      ? selectedPeriodRow.resident_year
      : null;

  const selectedPdi =
    Number(
      selectedPeriodRow?.PDI
    );

  const hasStatus =
    Number.isFinite(
      selectedPdi
    );

  const isAcceptable =
    hasStatus &&
    selectedPdi >=
      PDI_THRESHOLD;

  return (
    <div className="physician-trend-modal">
      <div
        className="physician-trend-modal__backdrop"
        onClick={onClose}
      />

      <section
        className="glass u-container physician-trend-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="physician-trend-modal-title"
      >
        <header className="physician-trend-modal__header">
          <div className="physician-trend-modal__heading">
            <h2
              id="physician-trend-modal-title"
              className="physician-trend-modal__title"
            >
              {physician.name}
            </h2>

            <div className="physician-trend-modal__meta">
              {residentYear !==
                null && (
                <span className="physician-trend-modal__year">
                  سال{' '}
                  {toPersianDigits(
                    residentYear
                  )}
                </span>
              )}

              {hasStatus && (
                <span
                  className={`physician-trend-modal__status ${
                    isAcceptable
                      ? 'physician-trend-modal__status--good'
                      : 'physician-trend-modal__status--bad'
                  }`}
                >
                  <span
                    className="physician-trend-modal__status-dot"
                    aria-hidden="true"
                  />

                  {isAcceptable
                    ? 'قابل قبول'
                    : 'غیر قابل قبول'}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="physician-trend-modal__close"
            onClick={onClose}
            aria-label="بستن"
          >
            ×
          </button>
        </header>

        <div className="physician-trend-modal__body">
          {loading && (
            <div className="physician-trend-modal__state">
              در حال بارگذاری...
            </div>
          )}

          {!loading &&
            error && (
              <div className="physician-trend-modal__state physician-trend-modal__state--error">
                {error}
              </div>
            )}

          {!loading &&
            !error &&
            !hasData && (
              <div className="physician-trend-modal__state">
                داده‌ای برای این پزشک در بازه‌های زمانی ذخیره‌شده وجود ندارد.
              </div>
            )}

          {!loading &&
            !error &&
            hasData && (
              <>
                <PhysicianTrendKpiCards
                  row={
                    selectedPeriodRow
                  }
                  data={
                    trendData
                  }
                />

                <PhysicianScoreTrendChart
                  data={
                    trendData
                  }
                />

                <PhysicianDocumentationBubbleChart
                  data={
                    trendData
                  }
                />
              </>
            )}
        </div>
      </section>
    </div>
  );
};

export default PhysicianTrendModal;