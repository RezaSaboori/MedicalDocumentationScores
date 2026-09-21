import React from 'react';

const QualityMixLegendFooter = ({
  categories,
  qualityKeys,
  nameOffset,
  metaWidth,
  scoreGutter,
}) => {
  const calibratedGradient = `linear-gradient(
    to right,
    ${categories.Q0?.color || '#B0BEC5'} 0%,
    ${categories.Q1?.color || '#D84315'} 25%,
    ${categories.Q2?.color || '#F28E2B'} 50%,
    ${categories.Q3?.color || '#BFD200'} 75%,
    ${categories.Q4?.color || '#38B000'} 95%,
    ${categories.Q5?.color || '#004B23'} 100%
  )`;

  return (
    <div className="qm-footer">
      <div className="qm-footer__panel qm-footer__panel--left">
        <div
          className="qm-footer__left-content"
          style={{
            marginLeft: nameOffset,
          }}
        >
          <div
            className="qm-footer__column qm-footer__column--meta"
            style={{
              width: metaWidth,
            }}
          >
            <div className="qm-footer__label">
              میانگین نمره
            </div>

            <div
              className="qm-footer__gradient"
              style={{
                background:
                  calibratedGradient,
              }}
            />
          </div>

          <div
            className="qm-footer__column qm-footer__column--meta"
            style={{
              width: metaWidth,
            }}
          >
            <div className="qm-footer__label">
              ویزیت
            </div>

            <div className="qm-footer__gradient qm-footer__gradient--visits" />
          </div>

          <div className="qm-footer__column qm-footer__column--quality">
            <div className="qm-footer__label">
              توزیع کیفیت پرونده‌ها
            </div>

            <div className="qm-footer__quality-items">
              {qualityKeys.map((key) => (
                <span
                  key={key}
                  className="qm-footer__quality-item"
                >
                  <span
                    className="qm-footer__quality-swatch"
                    style={{
                      backgroundColor:
                        categories[key].color,
                    }}
                  />

                  <span>
                    {categories[key].label}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="qm-footer__panel qm-footer__panel--right">
        <div
          className="qm-footer__score-content"
          style={{
            marginRight:
              scoreGutter,
          }}
        >
          <div className="qm-footer__column qm-footer__column--score">
            <div className="qm-footer__label">
              امتیاز کیفیت ثبت پرونده‌ها
            </div>

            <div className="qm-footer__gradient qm-footer__gradient--score" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityMixLegendFooter;