/**
 * Музыкальное сопровождение из MP3 в static/audio/ (Flask: /static/audio/...).
 * Файлы: music_topic_1.mp3 … music_topic_5.mp3. Неизвестный номер темы — трек темы 1.
 */

let currentAudio = null;

function topicTrackPath(topicId) {
  const n = Number(topicId);
  const idx = n >= 1 && n <= 5 ? n : 1;
  return `/static/audio/music_topic_${idx}.mp3`;
}

/**
 * Запускает музыку для заданной темы (модуля)
 * @param {number} topicId — номер темы
 * @param {boolean} enabled — включена ли музыка
 */
export function startMissionMusic(topicId, enabled) {
  stopMissionMusic();

  if (!enabled) return;

  const audioPath = topicTrackPath(topicId);

  // Создаём и запускаем аудио
  currentAudio = new Audio(audioPath);
  currentAudio.loop = true; // зацикливаем
  currentAudio.volume = 0.5; // громкость 50%

  // Запускаем воспроизведение (браузер может заблокировать до клика)
  currentAudio.play().catch((error) => {
    console.warn("Не удалось воспроизвести музыку:", error);
  });
}

/**
 * Останавливает текущую музыку
 */
export function stopMissionMusic() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0; // сбрасываем позицию
    currentAudio = null;
  }
}
