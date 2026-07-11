import { ChidLogo } from './components/ChidLogo'
import { MortgageCalculator } from './components/MortgageCalculator'

function App() {
  return (
    <div className="min-h-screen bg-chid-white">
      <header className="border-b border-chid-ring/40 bg-chid-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <ChidLogo className="h-14 w-auto md:h-16" />
          <a
            href="tel:+70000000000"
            className="text-sm font-medium text-chid-text/80 hover:text-chid-btn"
          >
            +7 (000) 000-00-00
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="mb-10">
          <h1 className="text-3xl font-bold text-chid-text md:text-4xl">
            Ипотечный калькулятор
          </h1>
          <p className="mt-3 max-w-2xl text-chid-text/70">
            Рассчитайте ежемесячный платёж, срок и переплату по ипотеке онлайн.
            Точные расчёты для покупки недвижимости с CHID.
          </p>
        </section>

        <MortgageCalculator />

        <section className="mt-16 space-y-4 text-chid-text/70">
          <h2 className="text-2xl font-semibold text-chid-text">Как работает ипотечный калькулятор</h2>
          <p>
            Калькулятор помогает заранее оценить ежемесячный платёж и общую переплату по кредиту.
            Укажите стоимость недвижимости, первоначальный взнос, срок и процентную ставку.
          </p>
          <p>
            Аннуитетный платёж — одинаковая сумма каждый месяц. Дифференцированный — платёж
            уменьшается к концу срока, но первые месяцы выше.
          </p>
        </section>
      </main>

      <footer className="mt-16 border-t border-chid-ring/40 bg-chid-white py-8 text-center text-sm text-chid-text/60">
        © {new Date().getFullYear()} CHID — Агентство недвижимости
      </footer>
    </div>
  )
}

export default App
