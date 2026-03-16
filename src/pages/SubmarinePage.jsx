import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as submarinesApi from '../api/submarines';
import TagChips from '../components/TagChips';
import './SubmarinePage.css';

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatNumber(value, fractionDigits = 0) {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return '—';
    return Number(value).toLocaleString('ru-RU', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
}

function metric(label, value) {
    return (
        <div className="submarine-metric">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

export default function SubmarinePage() {
    const { externalId } = useParams();
    const [submarine, setSubmarine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadSubmarine = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await submarinesApi.getSubmarine(externalId);
                if (!cancelled) {
                    setSubmarine(response);
                }
            } catch (err) {
                if (!cancelled) {
                    setSubmarine(null);
                    setError(err?.message || 'Не удалось загрузить подлодку');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadSubmarine();

        return () => {
            cancelled = true;
        };
    }, [externalId]);

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Загрузка подлодки...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !submarine) {
        return (
            <div className="page">
                <div className="container">
                    <div className="auth-error">{error}</div>
                    <Link to="/submarines" className="btn btn-ghost submarine-back-btn">
                        ← Назад к каталогу
                    </Link>
                </div>
            </div>
        );
    }

    const statusLabel = submarine.blocked ? 'BLOCKED' : submarine.active ? 'ACTIVE' : 'UNKNOWN';

    return (
        <div className="page submarine-page">
            <div className="container submarine-page-container">
                <Link to="/submarines" className="back-link">← Назад к подлодкам</Link>

                <section className="submarine-hero glass-card">
                    <h1>{submarine.title}</h1>
                    <p className="submarine-hero-subtitle">
                        {submarine.submarineClass || '—'} · Tier {submarine.tier ?? '—'}
                        {submarine.fabricationType ? ` · ${submarine.fabricationType}` : ''}
                    </p>
                    <p className="submarine-hero-description">{submarine.description || 'Нет описания.'}</p>
                </section>

                <div className="submarine-layout">
                    <main className="submarine-main">
                        <section className="submarine-section glass-card">
                            <h2>Базовые характеристики</h2>
                            <div className="submarine-metrics-grid">
                                {metric('Цена', `${formatNumber(submarine.price)} mk`)}
                                {metric('Экипаж', submarine.recommendedCrewDisplay || `${submarine.recommendedCrewMin ?? '—'} - ${submarine.recommendedCrewMax ?? '—'}`)}
                                {metric('Грузоподъёмность', formatNumber(submarine.cargoCapacity))}
                                {metric('Макс. скорость (гориз.)', `${formatNumber(submarine.maxHorizontalSpeedKph, 1)} км/ч`)}
                                {metric('Слотов турелей', formatNumber(submarine.turretSlotCount))}
                                {metric('Крупных слотов', formatNumber(submarine.largeTurretSlotCount))}
                            </div>
                        </section>

                        <section className="submarine-section glass-card">
                            <h2>Технические параметры</h2>
                            <div className="submarine-metrics-grid">
                                {metric('Длина', submarine.lengthMeters !== undefined && submarine.lengthMeters !== null ? `${formatNumber(submarine.lengthMeters, 1)} м` : '—')}
                                {metric('Высота', submarine.heightMeters !== undefined && submarine.heightMeters !== null ? `${formatNumber(submarine.heightMeters, 1)} м` : '—')}
                                {metric('Макс. погружение', submarine.maxDescentSpeedKph !== undefined && submarine.maxDescentSpeedKph !== null ? `${formatNumber(submarine.maxDescentSpeedKph, 1)} км/ч` : '—')}
                                {metric('Реактор', submarine.maxReactorOutputKw !== undefined && submarine.maxReactorOutputKw !== null ? `${formatNumber(submarine.maxReactorOutputKw, 1)} кВт` : '—')}
                            </div>
                        </section>

                        <section className="submarine-section glass-card">
                            <h2>Вооружение по умолчанию</h2>
                            <div className="submarine-weapons">
                                <div>
                                    <h3>Обычные турели</h3>
                                    {submarine.defaultTurretWeapons?.length ? (
                                        <ul>
                                            {submarine.defaultTurretWeapons.map((weapon) => (
                                                <li key={weapon}>{weapon}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>Не указано</p>
                                    )}
                                </div>
                                <div>
                                    <h3>Крупные турели</h3>
                                    {submarine.defaultLargeTurretWeapons?.length ? (
                                        <ul>
                                            {submarine.defaultLargeTurretWeapons.map((weapon) => (
                                                <li key={weapon}>{weapon}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>Не указано</p>
                                    )}
                                </div>
                            </div>
                        </section>
                    </main>

                    <aside className="submarine-sidebar">
                        <section className="submarine-section glass-card">
                            <h2>Метаданные</h2>
                            <div className="submarine-meta">
                                <p><strong>External ID:</strong> {submarine.externalId ?? submarine.external_id ?? '—'}</p>
                                <p><strong>Автор:</strong> {submarine.authorUsername || submarine.author_username || '—'}</p>
                                <p><strong>Статус:</strong> {statusLabel}</p>
                                <p><strong>Создано:</strong> {formatDate(submarine.createdAt || submarine.created_at)}</p>
                                <p><strong>Обновлено:</strong> {formatDate(submarine.updatedAt || submarine.updated_at)}</p>
                            </div>
                        </section>

                        <section className="submarine-section glass-card">
                            <h2>Теги</h2>
                            <TagChips tags={Array.isArray(submarine.tags) ? submarine.tags : []} />
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}
