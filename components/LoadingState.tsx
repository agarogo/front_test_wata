export default function LoadingState({ label = 'Загрузка...' }: { label?: string }) {
  return (
    <div className="state-box">
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
