import { STORAGE_KEYS } from "./storageKeys";
import { readFromStorage, writeToStorage } from "./worksStorage";

/**
 * Повертає всі коментарі, згруповані за ID твору.
 *
 * @returns {Object.<string, Array>} Об'єкт коментарів.
 */
export function getAllCommentsByWork() {
  return readFromStorage(STORAGE_KEYS.COMMENTS, {});
}

/**
 * Зберігає всі коментарі, згруповані за ID твору.
 *
 * @param {Object.<string, Array>} commentsByWork - Об'єкт коментарів.
 * @returns {void}
 */
export function saveAllCommentsByWork(commentsByWork) {
  writeToStorage(STORAGE_KEYS.COMMENTS, commentsByWork);
}

/**
 * Повертає коментарі конкретного твору.
 *
 * @param {Object.<string, Array>} commentsByWork - Об'єкт коментарів.
 * @param {number|string} workId - ID твору.
 * @returns {Array} Масив коментарів твору.
 */
export function getWorkComments(commentsByWork, workId) {
  return commentsByWork[String(workId)] || [];
}

/**
 * Оновлює коментарі конкретного твору.
 *
 * @param {Object.<string, Array>} commentsByWork - Поточні коментарі.
 * @param {number|string} workId - ID твору.
 * @param {Array} updatedWorkComments - Оновлені коментарі твору.
 * @returns {Object.<string, Array>} Новий об'єкт коментарів.
 */
export function updateWorkComments(commentsByWork, workId, updatedWorkComments) {
  return {
    ...commentsByWork,
    [String(workId)]: updatedWorkComments,
  };
}

/**
 * Повертає повне ім'я автора коментаря.
 *
 * @param {Object|null} user - Дані користувача.
 * @returns {string} Повне ім'я або логін користувача.
 */
export function getCommentAuthor(user) {
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.login;
}

/**
 * Додає новий коментар до твору.
 *
 * @param {Object.<string, Array>} commentsByWork - Поточні коментарі.
 * @param {number|string} workId - ID твору.
 * @param {Object} newComment - Новий коментар.
 * @returns {Object.<string, Array>} Оновлені коментарі.
 */
export function addCommentToWork(commentsByWork, workId, newComment) {
  const workComments = getWorkComments(commentsByWork, workId);

  return updateWorkComments(commentsByWork, workId, [
    ...workComments,
    newComment,
  ]);
}

/**
 * Редагує власний коментар користувача.
 *
 * @param {Object.<string, Array>} commentsByWork - Поточні коментарі.
 * @param {number|string} workId - ID твору.
 * @param {number|string} commentId - ID коментаря.
 * @param {string} userId - ID користувача.
 * @param {string} text - Новий текст коментаря.
 * @param {number|string} rating - Нова оцінка.
 * @returns {Object.<string, Array>} Оновлені коментарі.
 */
export function editOwnComment(
  commentsByWork,
  workId,
  commentId,
  userId,
  text,
  rating,
) {
  const workComments = getWorkComments(commentsByWork, workId);

  const updatedWorkComments = workComments.map((comment) => {
    const isOwnComment = comment.userId === userId;
    const isEditedComment = comment.id === commentId;

    if (!isOwnComment || !isEditedComment) {
      return comment;
    }

    return {
      ...comment,
      text,
      rating: Number(rating),
      updatedAt: new Date().toLocaleDateString("uk-UA"),
    };
  });

  return updateWorkComments(commentsByWork, workId, updatedWorkComments);
}

/**
 * Видаляє власний коментар користувача.
 *
 * @param {Object.<string, Array>} commentsByWork - Поточні коментарі.
 * @param {number|string} workId - ID твору.
 * @param {number|string} commentId - ID коментаря.
 * @param {string} userId - ID користувача.
 * @returns {Object.<string, Array>} Оновлені коментарі.
 */
export function deleteOwnCommentFromWork(
  commentsByWork,
  workId,
  commentId,
  userId,
) {
  const workComments = getWorkComments(commentsByWork, workId);

  const updatedWorkComments = workComments.filter((comment) => {
    return comment.id !== commentId || comment.userId !== userId;
  });

  return updateWorkComments(commentsByWork, workId, updatedWorkComments);
}

/**
 * Додає або прибирає лайк з коментаря.
 *
 * @param {Object.<string, Array>} commentsByWork - Поточні коментарі.
 * @param {number|string} workId - ID твору.
 * @param {number|string} commentId - ID коментаря.
 * @param {string} userId - ID користувача.
 * @returns {Object.<string, Array>} Оновлені коментарі.
 */
export function toggleCommentLikeByUser(
  commentsByWork,
  workId,
  commentId,
  userId,
) {
  const workComments = getWorkComments(commentsByWork, workId);

  const updatedWorkComments = workComments.map((comment) => {
    if (comment.id !== commentId) {
      return comment;
    }

    const likedBy = comment.likedBy || [];
    const isLiked = likedBy.includes(userId);

    return {
      ...comment,
      likedBy: isLiked
        ? likedBy.filter((likedUserId) => likedUserId !== userId)
        : [...likedBy, userId],
    };
  });

  return updateWorkComments(commentsByWork, workId, updatedWorkComments);
}

/**
 * Перевіряє, чи користувач уже залишив коментар до твору.
 *
 * @param {Array} workComments - Коментарі твору.
 * @param {string} userId - ID користувача.
 * @returns {boolean} true, якщо користувач уже коментував твір.
 */
export function hasUserCommentedWork(workComments, userId) {
  return workComments.some((comment) => comment.userId === userId);
}

/**
 * Повертає коментарі поточного користувача до всіх творів.
 *
 * @param {Object[]} works - Список творів.
 * @param {Object.<string, Array>} commentsByWork - Коментарі за ID твору.
 * @param {string} userId - ID поточного користувача.
 * @returns {Object[]} Список коментарів користувача.
 */
export function getUserComments(works, commentsByWork, userId) {
  return works.flatMap((work) => {
    const comments = getWorkComments(commentsByWork, work.id);

    return comments
      .filter((comment) => comment.userId === userId)
      .map((comment) => ({
        ...comment,
        workId: work.id,
        workTitle: work.title,
        workAuthor: work.author,
      }));
  });
}