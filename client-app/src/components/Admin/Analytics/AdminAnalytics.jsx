import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaDownload,
  FaCalendarAlt,
  FaUsers,
  FaChartLine,
  FaUserCheck,
  FaUserPlus,
  FaTimesCircle,
  FaClock,
  FaShoePrints,
  FaTrophy,
  FaPhone,
  FaEnvelope,
  FaExclamationTriangle,
} from 'react-icons/fa';
import WorkoutService from '../../../services/WorkoutSevices';
import { formatWorkoutDateBg, getSofiaDateParts } from '../../../utils/workoutDate';
import './AdminAnalytics.scss';

const RANGE_OPTIONS = ['7d', '30d', '90d', 'year', 'all', 'custom'];
const SHOE_LABELS = { 1: 'S', 2: 'M', 3: 'L', 4: 'XL' };

const formatDelta = (current, previous, suffix = '') => {
  const diff = Number(current) - Number(previous);
  if (!Number.isFinite(diff) || diff === 0) return null;
  const rounded = Number.isInteger(diff) ? diff : Number(diff.toFixed(1));
  return {
    positive: diff > 0,
    text: `${diff > 0 ? '+' : ''}${rounded}${suffix}`,
  };
};

const AdminAnalytics = () => {
  const { t } = useTranslation();
  const todayPart = getSofiaDateParts(new Date()).datePart;

  const [range, setRange] = useState('30d');
  const [fromDate, setFromDate] = useState(todayPart);
  const [toDate, setToDate] = useState(todayPart);
  const [appliedCustom, setAppliedCustom] = useState({ from: todayPart, to: todayPart });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportingType, setExportingType] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload =
        range === 'custom'
          ? { range: 'custom', from: appliedCustom.from, to: appliedCustom.to }
          : { range };
      const res = await WorkoutService.getAnalytics(payload);
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || t('admin.analytics.loadError'));
    } finally {
      setLoading(false);
    }
  }, [range, appliedCustom, t]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleApplyCustom = (e) => {
    e.preventDefault();
    setAppliedCustom({ from: fromDate, to: toDate });
    setRange('custom');
  };

  const handleExportCsv = async (type) => {
    setExportingType(type);
    try {
      const params =
        range === 'custom'
          ? { type, range: 'custom', from: appliedCustom.from, to: appliedCustom.to }
          : { type, range };
      await WorkoutService.exportAnalyticsCsv(params);
      toast.success(t('admin.analytics.exportSuccess'));
    } catch {
      toast.error(t('admin.analytics.exportError'));
    } finally {
      setExportingType(null);
    }
  };

  const getTranslatedDay = (day) =>
    day ? t(`days.${day.toLowerCase()}`, { defaultValue: day }) : '';

  const kpis = data?.Kpis || {};
  const trend = data?.Trend || [];
  const hasPrevious = Boolean(data?.HasPreviousPeriod);
  const maxTrendBookings = Math.max(1, ...trend.map((pt) => pt.BookingsCount || 0));

  const lead = data?.LeadTime || {};
  const leadTotal = Math.max(1, lead.TotalMeasured || 0);
  const avgDays = lead.AverageHoursBefore ? (lead.AverageHoursBefore / 24).toFixed(1) : '0';

  const shoesDemand = data?.ShoesDemand || {};
  const inactiveRegulars = data?.InactiveRegulars || [];

  return (
    <div className="admin-analytics-page">
      <div className="adm-page-header">
        <div className="adm-title-group">
          <h1>{t('admin.analytics.title')}</h1>
          <p>{t('admin.analytics.subtitle')}</p>
        </div>

        <div className="adm-header-actions">
          <button
            type="button"
            className="adm-btn adm-btn--secondary adm-btn--sm"
            disabled={exportingType === 'workouts'}
            onClick={() => handleExportCsv('workouts')}
          >
            <FaDownload aria-hidden="true" /> {t('admin.analytics.exportWorkoutsCsv')}
          </button>
          <button
            type="button"
            className="adm-btn adm-btn--secondary adm-btn--sm"
            disabled={exportingType === 'clients'}
            onClick={() => handleExportCsv('clients')}
          >
            <FaDownload aria-hidden="true" /> {t('admin.analytics.exportClientsCsv')}
          </button>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="adm-card analytics-filter-bar">
        <div className="range-pills" role="tablist" aria-label={t('admin.analytics.title')}>
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              role="tab"
              aria-selected={range === opt}
              className={`range-pill${range === opt ? ' active' : ''}`}
              onClick={() => setRange(opt)}
            >
              {t(`admin.analytics.ranges.${opt}`)}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <form onSubmit={handleApplyCustom} className="custom-range-form">
            <label>
              <span>{t('admin.analytics.fromDate')}</span>
              <input
                type="date"
                className="adm-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
              />
            </label>
            <label>
              <span>{t('admin.analytics.toDate')}</span>
              <input
                type="date"
                className="adm-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="adm-btn adm-btn--navy adm-btn--sm">
              {t('admin.analytics.applyCustom')}
            </button>
          </form>
        )}
      </div>

      {error && (
        <div className="adm-alert adm-alert--error">
          {t('admin.common.errorPrefix')} {error}
        </div>
      )}

      {loading ? (
        <div className="adm-loading" role="status">{t('admin.analytics.loading')}</div>
      ) : data && (
        <>
          {kpis.TotalWorkouts === 0 && range !== 'all' && (
            <div className="adm-card empty-period-banner">
              <div>
                <strong>{t('admin.analytics.emptyPeriodTitle')}</strong>
                <p>{t('admin.analytics.emptyPeriodHint')}</p>
              </div>
              <button
                type="button"
                className="adm-btn adm-btn--primary adm-btn--sm"
                onClick={() => setRange('all')}
              >
                {t('admin.analytics.switchToAll')}
              </button>
            </div>
          )}

          {/* 6 KPI Cards */}
          <section className="analytics-kpi-grid">
            <div className="adm-card akpi-card">
              <div className="akpi-top">
                <span className="akpi-label">{t('admin.analytics.kpis.workouts')}</span>
                <FaCalendarAlt className="akpi-icon navy" aria-hidden="true" />
              </div>
              <div className="akpi-value-row">
                <strong className="tabular-nums">{kpis.TotalWorkouts ?? 0}</strong>
                {hasPrevious && (() => {
                  const d = formatDelta(kpis.TotalWorkouts, kpis.PreviousTotalWorkouts);
                  return d ? <span className={`delta-pill ${d.positive ? 'up' : 'down'}`}>{d.text}</span> : null;
                })()}
              </div>
              <span className="akpi-sub tabular-nums">
                {t('admin.analytics.kpis.cancelledWorkouts', { count: kpis.CancelledWorkouts ?? 0 })}
              </span>
            </div>

            <div className="adm-card akpi-card">
              <div className="akpi-top">
                <span className="akpi-label">{t('admin.analytics.kpis.bookings')}</span>
                <FaUsers className="akpi-icon coral" aria-hidden="true" />
              </div>
              <div className="akpi-value-row">
                <strong className="tabular-nums">{kpis.TotalBookings ?? 0}</strong>
                {hasPrevious && (() => {
                  const d = formatDelta(kpis.TotalBookings, kpis.PreviousTotalBookings);
                  return d ? <span className={`delta-pill ${d.positive ? 'up' : 'down'}`}>{d.text}</span> : null;
                })()}
              </div>
              <span className="akpi-sub tabular-nums">
                {t('admin.analytics.kpis.avgPerClass', { avg: kpis.AverageBookingsPerWorkout ?? 0 })}
              </span>
            </div>

            <div className="adm-card akpi-card">
              <div className="akpi-top">
                <span className="akpi-label">{t('admin.analytics.kpis.occupancy')}</span>
                <FaChartLine className="akpi-icon emerald" aria-hidden="true" />
              </div>
              <div className="akpi-value-row">
                <strong className="tabular-nums">{kpis.OccupancyRatePercent ?? 0}%</strong>
                {hasPrevious && (() => {
                  const d = formatDelta(kpis.OccupancyRatePercent, kpis.PreviousOccupancyRatePercent, '%');
                  return d ? <span className={`delta-pill ${d.positive ? 'up' : 'down'}`}>{d.text}</span> : null;
                })()}
              </div>
              {hasPrevious && (
                <span className="akpi-sub">{t('admin.analytics.vsPrevious')}</span>
              )}
            </div>

            <div className="adm-card akpi-card">
              <div className="akpi-top">
                <span className="akpi-label">{t('admin.analytics.kpis.attendance')}</span>
                <FaUserCheck className="akpi-icon emerald" aria-hidden="true" />
              </div>
              <div className="akpi-value-row">
                <strong className="tabular-nums">{kpis.AttendanceRatePercent ?? 0}%</strong>
              </div>
              <span className="akpi-sub tabular-nums">
                {t('admin.analytics.kpis.noShowMeta', {
                  attended: kpis.AttendedCount ?? 0,
                  past: kpis.PastBookingsCount ?? 0,
                  noShows: kpis.NoShowCount ?? 0,
                })}
              </span>
            </div>

            <div className="adm-card akpi-card">
              <div className="akpi-top">
                <span className="akpi-label">{t('admin.analytics.kpis.newClients')}</span>
                <FaUserPlus className="akpi-icon navy" aria-hidden="true" />
              </div>
              <div className="akpi-value-row">
                <strong className="tabular-nums">{kpis.NewClientsCount ?? 0}</strong>
                {hasPrevious && (() => {
                  const d = formatDelta(kpis.NewClientsCount, kpis.PreviousNewClientsCount);
                  return d ? <span className={`delta-pill ${d.positive ? 'up' : 'down'}`}>{d.text}</span> : null;
                })()}
              </div>
              <span className="akpi-sub tabular-nums">
                {t('admin.analytics.kpis.retentionMeta', {
                  rate: kpis.RetentionRatePercent ?? 0,
                  returning: kpis.ReturningClientsCount ?? 0,
                })}
              </span>
            </div>

            <div className="adm-card akpi-card">
              <div className="akpi-top">
                <span className="akpi-label">{t('admin.analytics.kpis.cancellations')}</span>
                <FaTimesCircle className="akpi-icon amber" aria-hidden="true" />
              </div>
              <div className="akpi-value-row">
                <strong className="tabular-nums">{kpis.CancelledBookingsCount ?? 0}</strong>
              </div>
              <span className="akpi-sub tabular-nums">
                {t('admin.analytics.kpis.cancellationMeta', {
                  rate: kpis.CancellationRatePercent ?? 0,
                  late: kpis.LateCancellationsCount ?? 0,
                })}
              </span>
            </div>
          </section>

          {/* Bookings Trend SVG Chart */}
          <section className="adm-card analytics-panel">
            <div className="panel-head">
              <div>
                <h2>{t('admin.analytics.trendTitle')}</h2>
                <p>{t('admin.analytics.trendSubtitle')}</p>
              </div>
              <div className="chart-legend">
                <span className="legend-dot bookings">{t('admin.analytics.trendBookings')}</span>
                <span className="legend-dot occupancy">{t('admin.analytics.trendOccupancy')}</span>
              </div>
            </div>

            {trend.length > 0 ? (
              <div className="trend-chart-wrap">
                <svg
                  className="trend-svg"
                  viewBox={`0 0 ${Math.max(480, trend.length * 64)} 210`}
                  role="img"
                  aria-label={t('admin.analytics.trendTitle')}
                >
                  {[0.25, 0.5, 0.75, 1].map((line) => (
                    <line
                      key={line}
                      x1="0"
                      x2={Math.max(480, trend.length * 64)}
                      y1={160 - line * 124}
                      y2={160 - line * 124}
                      stroke="#e2e8f0"
                      strokeDasharray="4 4"
                    />
                  ))}
                  {trend.map((pt, idx) => {
                    const colW = Math.max(480, trend.length * 64) / trend.length;
                    const barW = Math.min(34, colW * 0.52);
                    const x = idx * colW + (colW - barW) / 2;
                    const barH = Math.max(4, Math.round((pt.BookingsCount / maxTrendBookings) * 124));
                    const y = 160 - barH;
                    const cx = idx * colW + colW / 2;

                    return (
                      <g key={pt.Label + idx}>
                        <rect
                          x={x}
                          y={y}
                          width={barW}
                          height={barH}
                          rx="6"
                          fill="#10204a"
                        />
                        <text
                          x={cx}
                          y={y - 6}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="700"
                          fill="#0f172a"
                        >
                          {pt.BookingsCount}
                        </text>
                        <text
                          x={cx}
                          y="178"
                          textAnchor="middle"
                          fontSize="11"
                          fill="#475569"
                        >
                          {pt.Label}
                        </text>
                        <text
                          x={cx}
                          y="194"
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                          fill="#ff6a3d"
                        >
                          {pt.OccupancyPercent}%
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <p className="panel-empty">{t('admin.analytics.noChartData')}</p>
            )}
          </section>

          {/* 2-col: Top Slots & Weekday Breakdown */}
          <div className="analytics-two-col">
            <section className="adm-card analytics-panel">
              <div className="panel-head">
                <h2>{t('admin.analytics.topSlotsTitle')}</h2>
              </div>
              {(data.TopTimeSlots || []).length > 0 ? (
                <div className="bars-list">
                  {data.TopTimeSlots.map((slot, idx) => (
                    <div key={`${slot.Day}-${slot.Time}-${idx}`} className="bar-item">
                      <div className="bar-top">
                        <strong>
                          {getTranslatedDay(slot.Day)} · <span className="tabular-nums">{slot.Time}</span>
                        </strong>
                        <span className="tabular-nums">
                          {t('admin.analytics.slotsClassesMeta', {
                            count: slot.WorkoutsCount,
                            avg: slot.AverageBookings,
                          })}{' '}
                          · <strong>{slot.OccupancyPercent}%</strong>
                        </span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill coral" style={{ width: `${slot.OccupancyPercent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="panel-empty">{t('admin.analytics.noChartData')}</p>
              )}
            </section>

            <section className="adm-card analytics-panel">
              <div className="panel-head">
                <h2>{t('admin.analytics.weekdayTitle')}</h2>
              </div>
              <div className="bars-list">
                {(data.WeekdayBreakdown || []).map((wd) => (
                  <div key={wd.Day} className="bar-item">
                    <div className="bar-top">
                      <strong>{getTranslatedDay(wd.Day)}</strong>
                      <span className="tabular-nums">
                        {wd.TotalBookings} / {wd.TotalCapacity} ({wd.OccupancyPercent}%)
                      </span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill navy" style={{ width: `${wd.OccupancyPercent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 2-col: Shoe Demand & Lead Time */}
          <div className="analytics-two-col">
            <section className="adm-card analytics-panel">
              <div className="panel-head">
                <div>
                  <h2>
                    <FaShoePrints aria-hidden="true" /> {t('admin.analytics.shoesTitle')}
                  </h2>
                  <p>{t('admin.analytics.shoesSubtitle')}</p>
                </div>
              </div>

              <div className="shoes-split-chips tabular-nums">
                <span className="split-chip studio">
                  {t('admin.analytics.studioShoesShare', { count: shoesDemand.StudioShoesBookingsCount ?? 0 })}
                </span>
                <span className="split-chip own">
                  {t('admin.analytics.ownShoesShare', {
                    count: shoesDemand.OwnShoesBookingsCount ?? 0,
                    percent: shoesDemand.OwnShoesSharePercent ?? 0,
                  })}
                </span>
              </div>

              <div className="bars-list">
                {(shoesDemand.Sizes || []).map((sz) => (
                  <div key={sz.Size} className="bar-item">
                    <div className="bar-top">
                      <div className="size-title-row">
                        <span className="shoe-badge">{SHOE_LABELS[Number(sz.Size)] || '?'}</span>
                        <span className="tabular-nums">
                          {t('admin.analytics.shoeRowMeta', {
                            bookings: sz.BookingsCount,
                            share: sz.SharePercent,
                            inventory: sz.InventoryCount,
                          })}
                        </span>
                      </div>
                      {sz.SoldOutWorkoutsCount > 0 && (
                        <span className={`soldout-badge tabular-nums${sz.SoldOutRatePercent >= 50 ? ' high' : ''}`}>
                          {t('admin.analytics.soldOutBadge', {
                            rate: sz.SoldOutRatePercent,
                            count: sz.SoldOutWorkoutsCount,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill coral" style={{ width: `${sz.SharePercent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="adm-card analytics-panel">
              <div className="panel-head">
                <div>
                  <h2>
                    <FaClock aria-hidden="true" /> {t('admin.analytics.leadTimeTitle')}
                  </h2>
                  <p className="tabular-nums">
                    {t('admin.analytics.leadTimeAvg', {
                      hours: lead.AverageHoursBefore ?? 0,
                      days: avgDays,
                    })}
                  </p>
                </div>
              </div>

              <div className="bars-list">
                {[
                  { key: 'sameDay', count: lead.SameDayCount ?? 0 },
                  { key: 'oneToTwo', count: lead.OneToTwoDaysCount ?? 0 },
                  { key: 'threeToSeven', count: lead.ThreeToSevenDaysCount ?? 0 },
                  { key: 'overSeven', count: lead.OverSevenDaysCount ?? 0 },
                ].map((bucket) => {
                  const pct = lead.TotalMeasured > 0 ? Math.round((bucket.count / leadTotal) * 100) : 0;
                  return (
                    <div key={bucket.key} className="bar-item">
                      <div className="bar-top">
                        <strong>{t(`admin.analytics.leadBuckets.${bucket.key}`)}</strong>
                        <span className="tabular-nums">
                          {bucket.count} ({pct}%)
                        </span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill emerald" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* 2-col: Top Loyal Clients & Inactive Regulars */}
          <div className="analytics-two-col">
            <section className="adm-card analytics-panel">
              <div className="panel-head">
                <h2>
                  <FaTrophy aria-hidden="true" /> {t('admin.analytics.topClientsTitle')}
                </h2>
              </div>

              {(data.TopClients || []).length > 0 ? (
                <div className="clients-mini-list">
                  {data.TopClients.map((client, idx) => (
                    <div key={client.ClientKey} className="client-mini-row">
                      <div className="cm-left">
                        <span className="rank-badge tabular-nums">{idx + 1}</span>
                        <div>
                          <strong>{client.FullName}</strong>
                          <span className="cm-meta tabular-nums">
                            {t('admin.analytics.clientVisitsMeta', {
                              total: client.TotalBookings,
                              attended: client.AttendedCount,
                            })}
                          </span>
                        </div>
                      </div>
                      {client.PhoneNumber && (
                        <a
                          href={`tel:${client.PhoneNumber.replace(/\s+/g, '')}`}
                          className="contact-icon-btn"
                          aria-label={client.PhoneNumber}
                        >
                          <FaPhone aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="panel-empty">{t('admin.analytics.noClientsData')}</p>
              )}
            </section>

            <section className="adm-card analytics-panel">
              <div className="panel-head">
                <div>
                  <h2>
                    <FaExclamationTriangle aria-hidden="true" /> {t('admin.analytics.inactiveTitle')}
                  </h2>
                  <p>{t('admin.analytics.inactiveSubtitle')}</p>
                </div>
              </div>

              {inactiveRegulars.length > 0 ? (
                <div className="clients-mini-list">
                  {inactiveRegulars.map((client) => (
                    <div key={client.ClientKey} className="client-mini-row">
                      <div className="cm-left">
                        <div>
                          <strong>{client.FullName}</strong>
                          <span className="cm-meta tabular-nums">
                            {formatWorkoutDateBg(client.LastWorkoutDate)} ·{' '}
                            {t('admin.analytics.inactiveDaysAgo', { days: client.DaysSinceLastWorkout })} ·{' '}
                            {client.TotalBookings}x
                          </span>
                        </div>
                      </div>
                      <div className="cm-actions">
                        {client.PhoneNumber && (
                          <a
                            href={`tel:${client.PhoneNumber.replace(/\s+/g, '')}`}
                            className="contact-icon-btn"
                            aria-label={client.PhoneNumber}
                          >
                            <FaPhone aria-hidden="true" />
                          </a>
                        )}
                        {client.Email && (
                          <a
                            href={`mailto:${client.Email}`}
                            className="contact-icon-btn"
                            aria-label={client.Email}
                          >
                            <FaEnvelope aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="panel-empty">{t('admin.analytics.noInactiveClients')}</p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
