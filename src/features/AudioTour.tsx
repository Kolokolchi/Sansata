import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Download,
  Headphones,
  ArrowUpRight
} from 'lucide-react';
import { siteUrl, navigateTo } from '../lib/site';
import tracks from '../data/audio-tour.json';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

export function AudioTour() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState('');
  const shouldResume = useRef(false);

  const currentTrack = tracks[currentIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
    audio.volume = volume;
  }, [playbackRate, volume, currentIndex]);

  const handlePlay = () => {
    setError('');
    audioRef.current?.play().catch(() => {
      setIsPlaying(false);
      setError('Не удалось воспроизвести запись. Попробуйте ещё раз или скачайте аудиофайл.');
    });
  };

  const handleSelectTrack = (index: number) => {
    shouldResume.current = isPlaying;
    setIsPlaying(false);
    setElapsed(0);
    setDuration(0);
    setError('');
    setCurrentIndex((index + tracks.length) % tracks.length);
  };

  return (
    <div className="experience-page audio-page">
      <div className="page-heading">
        <span className="eyebrow">SHATTYQ / АУДИОЭКСКУРСИЯ</span>
        <h1>
          Послушайте историю
          <br />
          вашего будущего дома.
        </h1>
        <p>Пять коротких глав о проекте. Авторский текст по материалам Sensata, синтезированная озвучка.</p>
      </div>

      <div className="audio-layout">
        <div className="audio-cover">
          <img src={siteUrl(currentTrack.image)} alt={currentTrack.title} />
          <span>
            <Headphones size={20} /> Глава {currentIndex + 1} / {tracks.length}
          </span>
        </div>

        <div className="audio-player">
          <span className="eyebrow">СЕЙЧАС В ПЛЕЕРЕ</span>
          <h2>{currentTrack.title}</h2>

          <audio
            ref={audioRef}
            src={siteUrl(`/audio/${currentTrack.id}.wav`)}
            preload="metadata"
            onLoadedMetadata={() => {
              setDuration(audioRef.current?.duration || 0);
              if (shouldResume.current) {
                shouldResume.current = false;
                handlePlay();
              }
            }}
            onTimeUpdate={() => setElapsed(audioRef.current?.currentTime || 0)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              if (currentIndex < tracks.length - 1) {
                shouldResume.current = true;
                setCurrentIndex(currentIndex + 1);
                setElapsed(0);
              } else {
                setIsPlaying(false);
              }
            }}
            onError={() => setError('Запись недоступна. Текст экскурсии приведён ниже.')}
          />

          <div className="audio-seek">
            <input
              aria-label="Позиция воспроизведения"
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={Math.min(elapsed, duration)}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (audioRef.current) audioRef.current.currentTime = val;
                setElapsed(val);
              }}
            />
            <div>
              <span>{formatTime(elapsed)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="audio-buttons">
            <button
              className="icon"
              aria-label="Предыдущая глава"
              onClick={() => handleSelectTrack(currentIndex - 1)}
            >
              <SkipBack />
            </button>

            <button
              className="play-main"
              aria-label={isPlaying ? 'Пауза' : 'Слушать экскурсию'}
              onClick={() => (isPlaying ? audioRef.current?.pause() : handlePlay())}
            >
              {isPlaying ? <Pause /> : <Play />}
            </button>

            <button
              className="icon"
              aria-label="Следующая глава"
              onClick={() => handleSelectTrack(currentIndex + 1)}
            >
              <SkipForward />
            </button>

            <label className="speed-label">
              Скорость
              <select
                aria-label="Скорость воспроизведения"
                value={playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
              >
                {[0.75, 1, 1.25, 1.5].map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}×
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="volume">
            <Volume2 size={18} />
            <span className="sr-only">Громкость</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>

          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}

          <div className="track-list">
            {tracks.map((track, i) => (
              <button
                key={track.id}
                className={i === currentIndex ? 'active' : ''}
                onClick={() => {
                  if (i === currentIndex) {
                    isPlaying ? audioRef.current?.pause() : handlePlay();
                  } else {
                    handleSelectTrack(i);
                  }
                }}
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
                <strong>{track.title}</strong>
                {i === currentIndex && isPlaying ? <Pause size={17} /> : <Play size={17} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="transcript">
        <div>
          <span className="eyebrow">ТЕКСТ ЭКСКУРСИИ</span>
          <h2>{currentTrack.title}</h2>
          <p>{currentTrack.text}</p>
        </div>
        <a className="button outline" href={siteUrl(`/audio/${currentTrack.id}.wav`)} download>
          <Download size={17} /> Скачать главу
        </a>
      </section>

      <a
        className="button blue"
        href={siteUrl('/tour')}
        onClick={(e) => {
          e.preventDefault();
          navigateTo(siteUrl('/tour'));
        }}
      >
        Продолжить знакомство в 3D <ArrowUpRight size={18} />
      </a>
    </div>
  );
}
