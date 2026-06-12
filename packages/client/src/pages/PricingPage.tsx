import { useAsync } from '../hooks/useAsync';
import { fetchPlans, type Plan } from '../api';

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div className="flex flex-col bg-white border border-sage-100 hover:border-sage-300 transition-colors duration-200 p-8 md:p-10">
      {/* Accent bar */}
      <div className="w-8 h-0.5 bg-sage-500 mb-6" />

      <h3 className="text-lg font-semibold tracking-wide text-[var(--color-text-primary)] mb-2">
        {plan.name}
      </h3>

      {plan.description && (
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
          {plan.description}
        </p>
      )}

      {/* Items list */}
      {plan.items.length > 0 && (
        <ul className="flex flex-col gap-2 mb-8 flex-1">
          {plan.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-[var(--color-text-primary)]">
              <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-sage-400" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Price */}
      <div className="mt-auto pt-6 border-t border-sage-100">
        <p className="text-xs tracking-widest text-sage-500 mb-1">費用</p>
        <p className="text-2xl font-light text-sage-800 tracking-wide">
          NT${' '}
          <span className="text-3xl font-semibold">
            {plan.price.toLocaleString('zh-TW')}
          </span>
        </p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { state, reload } = useAsync(() => fetchPlans(), []);

  return (
    <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
      <h1 className="text-xs tracking-[0.35em] text-sage-500 uppercase mb-2 text-center">
        Pricing
      </h1>
      <p className="text-2xl md:text-3xl font-light tracking-wide text-center text-[var(--color-text-primary)] mb-4">
        價目表
      </p>
      <p className="text-sm text-[var(--color-text-secondary)] text-center tracking-wide mb-14 max-w-md mx-auto leading-relaxed">
        所有方案均為固定定價，無隱藏費用。如有特殊需求歡迎洽詢。
      </p>

      {/* Loading */}
      {state.status === 'loading' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-80 bg-sage-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && (
        <div className="py-24 text-center">
          <p className="text-sm text-[var(--color-text-secondary)] tracking-widest mb-4">
            載入失敗，請稍後再試
          </p>
          <button
            onClick={reload}
            className="text-xs tracking-widest text-sage-600 underline underline-offset-4"
          >
            重新載入
          </button>
        </div>
      )}

      {/* Empty */}
      {state.status === 'success' && state.data.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-sm text-[var(--color-text-secondary)] tracking-widest">
            價目表即將上線，敬請期待
          </p>
        </div>
      )}

      {/* Plans grid */}
      {state.status === 'success' && state.data.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.data.map((plan: Plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </section>
  );
}
