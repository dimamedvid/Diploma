import {
  APPROVED_WORKS_STORAGE_KEY,
  PENDING_WORKS_STORAGE_KEY,
  REJECTED_WORKS_STORAGE_KEY,
  readFromStorage,
  writeToStorage,
} from "./worksStorage";

/**
 * Повертає твори, які очікують модерації.
 *
 * @returns {Object[]} Список творів на модерації.
 */
export function getPendingWorks() {
  return readFromStorage(PENDING_WORKS_STORAGE_KEY, []);
}

/**
 * Повертає підтверджені користувацькі твори.
 *
 * @returns {Object[]} Список підтверджених творів.
 */
export function getApprovedWorks() {
  return readFromStorage(APPROVED_WORKS_STORAGE_KEY, []);
}

/**
 * Повертає відхилені користувацькі твори.
 *
 * @returns {Object[]} Список відхилених творів.
 */
export function getRejectedWorks() {
  return readFromStorage(REJECTED_WORKS_STORAGE_KEY, []);
}

/**
 * Зберігає твори, які очікують модерації.
 *
 * @param {Object[]} works - Список творів.
 * @returns {void}
 */
export function savePendingWorks(works) {
  writeToStorage(PENDING_WORKS_STORAGE_KEY, works);
}

/**
 * Зберігає підтверджені користувацькі твори.
 *
 * @param {Object[]} works - Список творів.
 * @returns {void}
 */
export function saveApprovedWorks(works) {
  writeToStorage(APPROVED_WORKS_STORAGE_KEY, works);
}

/**
 * Зберігає відхилені користувацькі твори.
 *
 * @param {Object[]} works - Список творів.
 * @returns {void}
 */
export function saveRejectedWorks(works) {
  writeToStorage(REJECTED_WORKS_STORAGE_KEY, works);
}

/**
 * Повертає всі користувацькі твори незалежно від статусу.
 *
 * @param {Object[]} pendingWorks - Твори на модерації.
 * @param {Object[]} approvedWorks - Підтверджені твори.
 * @param {Object[]} rejectedWorks - Відхилені твори.
 * @returns {Object[]} Усі користувацькі твори.
 */
export function getAllSubmittedWorks(
  pendingWorks,
  approvedWorks,
  rejectedWorks,
) {
  return [...pendingWorks, ...approvedWorks, ...rejectedWorks];
}

/**
 * Підтверджує твір і переносить його з pending до approved.
 *
 * @param {Object[]} pendingWorks - Твори на модерації.
 * @param {Object[]} approvedWorks - Підтверджені твори.
 * @param {number|string} workId - ID твору.
 * @returns {{ updatedPendingWorks: Object[], updatedApprovedWorks: Object[], approvedWork: Object|null }} Результат операції.
 */
export function approveWorkById(pendingWorks, approvedWorks, workId) {
  const workToApprove = pendingWorks.find((work) => work.id === workId);

  if (!workToApprove) {
    return {
      updatedPendingWorks: pendingWorks,
      updatedApprovedWorks: approvedWorks,
      approvedWork: null,
    };
  }

  const approvedWork = {
    ...workToApprove,
    status: "approved",
    approvedAt: new Date().toLocaleDateString("uk-UA"),
    rejectedAt: "",
    rejectionReason: "",
  };

  return {
    updatedPendingWorks: pendingWorks.filter((work) => work.id !== workId),
    updatedApprovedWorks: [...approvedWorks, approvedWork],
    approvedWork,
  };
}

/**
 * Відхиляє твір і переносить його з pending до rejected.
 *
 * @param {Object[]} pendingWorks - Твори на модерації.
 * @param {Object[]} rejectedWorks - Відхилені твори.
 * @param {number|string} workId - ID твору.
 * @param {string} reason - Причина відхилення.
 * @returns {{ updatedPendingWorks: Object[], updatedRejectedWorks: Object[], rejectedWork: Object|null }} Результат операції.
 */
export function rejectWorkById(pendingWorks, rejectedWorks, workId, reason) {
  const workToReject = pendingWorks.find((work) => work.id === workId);

  if (!workToReject) {
    return {
      updatedPendingWorks: pendingWorks,
      updatedRejectedWorks: rejectedWorks,
      rejectedWork: null,
    };
  }

  const rejectedWork = {
    ...workToReject,
    status: "rejected",
    rejectedAt: new Date().toLocaleDateString("uk-UA"),
    rejectionReason: reason,
  };

  return {
    updatedPendingWorks: pendingWorks.filter((work) => work.id !== workId),
    updatedRejectedWorks: [...rejectedWorks, rejectedWork],
    rejectedWork,
  };
}

/**
 * Шукає твір для редагування серед pending, approved і rejected.
 *
 * @param {number|string} workId - ID твору.
 * @param {Object[]} pendingWorks - Твори на модерації.
 * @param {Object[]} approvedWorks - Підтверджені твори.
 * @param {Object[]} rejectedWorks - Відхилені твори.
 * @returns {{ work: Object|null, source: string }} Знайдений твір і його статусне джерело.
 */
export function findWorkForEditing(
  workId,
  pendingWorks,
  approvedWorks,
  rejectedWorks,
) {
  const pendingWork = pendingWorks.find(
    (work) => String(work.id) === String(workId),
  );

  if (pendingWork) {
    return {
      work: pendingWork,
      source: "pending",
    };
  }

  const approvedWork = approvedWorks.find(
    (work) => String(work.id) === String(workId),
  );

  if (approvedWork) {
    return {
      work: approvedWork,
      source: "approved",
    };
  }

  const rejectedWork = rejectedWorks.find(
    (work) => String(work.id) === String(workId),
  );

  if (rejectedWork) {
    return {
      work: rejectedWork,
      source: "rejected",
    };
  }

  return {
    work: null,
    source: "",
  };
}

/**
 * Переносить відредагований твір назад на модерацію.
 *
 * Якщо твір уже був pending, він просто оновлюється в pending.
 * Якщо був approved або rejected, він прибирається зі старого списку і додається в pending.
 *
 * @param {Object} params - Параметри операції.
 * @param {Object} params.work - Старий твір.
 * @param {Object} params.updatedWork - Оновлений твір.
 * @param {string} params.source - Джерело твору.
 * @param {Object[]} params.pendingWorks - Твори на модерації.
 * @param {Object[]} params.approvedWorks - Підтверджені твори.
 * @param {Object[]} params.rejectedWorks - Відхилені твори.
 * @returns {{ updatedPendingWorks: Object[], updatedApprovedWorks: Object[], updatedRejectedWorks: Object[] }} Оновлені списки.
 */
export function moveEditedWorkToPending({
  work,
  updatedWork,
  source,
  pendingWorks,
  approvedWorks,
  rejectedWorks,
}) {
  if (source === "pending") {
    return {
      updatedPendingWorks: pendingWorks.map((pendingWork) =>
        pendingWork.id === work.id ? updatedWork : pendingWork,
      ),
      updatedApprovedWorks: approvedWorks,
      updatedRejectedWorks: rejectedWorks,
    };
  }

  const workForModeration = {
    ...updatedWork,
    submittedAt: new Date().toLocaleDateString("uk-UA"),
  };

  if (source === "approved") {
    return {
      updatedPendingWorks: [...pendingWorks, workForModeration],
      updatedApprovedWorks: approvedWorks.filter(
        (approvedWork) => approvedWork.id !== work.id,
      ),
      updatedRejectedWorks: rejectedWorks,
    };
  }

  return {
    updatedPendingWorks: [...pendingWorks, workForModeration],
    updatedApprovedWorks: approvedWorks,
    updatedRejectedWorks: rejectedWorks.filter(
      (rejectedWork) => rejectedWork.id !== work.id,
    ),
  };
}

/**
 * Видаляє користувацький твір залежно від його статусу.
 *
 * @param {Object} params - Параметри операції.
 * @param {number|string} params.workId - ID твору.
 * @param {string} params.statusType - Статус твору.
 * @param {Object[]} params.pendingWorks - Твори на модерації.
 * @param {Object[]} params.approvedWorks - Підтверджені твори.
 * @param {Object[]} params.rejectedWorks - Відхилені твори.
 * @returns {{ updatedPendingWorks: Object[], updatedApprovedWorks: Object[], updatedRejectedWorks: Object[] }} Оновлені списки.
 */
export function deleteUserWorkByStatus({
  workId,
  statusType,
  pendingWorks,
  approvedWorks,
  rejectedWorks,
}) {
  if (statusType === "pending") {
    return {
      updatedPendingWorks: pendingWorks.filter((work) => work.id !== workId),
      updatedApprovedWorks: approvedWorks,
      updatedRejectedWorks: rejectedWorks,
    };
  }

  if (statusType === "approved") {
    return {
      updatedPendingWorks: pendingWorks,
      updatedApprovedWorks: approvedWorks.filter((work) => work.id !== workId),
      updatedRejectedWorks: rejectedWorks,
    };
  }

  return {
    updatedPendingWorks: pendingWorks,
    updatedApprovedWorks: approvedWorks,
    updatedRejectedWorks: rejectedWorks.filter((work) => work.id !== workId),
  };
}

/**
 * Повертає всі твори конкретного користувача зі зручним статусом для кабінету.
 *
 * @param {string} userId - ID користувача.
 * @param {Object[]} pendingWorks - Твори на модерації.
 * @param {Object[]} approvedWorks - Підтверджені твори.
 * @param {Object[]} rejectedWorks - Відхилені твори.
 * @returns {Object[]} Список творів користувача.
 */
export function getUserWorksByStatus(
  userId,
  pendingWorks,
  approvedWorks,
  rejectedWorks,
) {
  return [
    ...pendingWorks
      .filter((work) => work.authorId === userId)
      .map((work) => ({
        ...work,
        displayStatus: "На модерації",
        statusType: "pending",
      })),
    ...approvedWorks
      .filter((work) => work.authorId === userId)
      .map((work) => ({
        ...work,
        displayStatus: "Опубліковано",
        statusType: "approved",
      })),
    ...rejectedWorks
      .filter((work) => work.authorId === userId)
      .map((work) => ({
        ...work,
        displayStatus: "Відхилено",
        statusType: "rejected",
      })),
  ];
}

/**
 * Зберігає всі три списки користувацьких творів.
 *
 * @param {Object[]} pendingWorks - Твори на модерації.
 * @param {Object[]} approvedWorks - Підтверджені твори.
 * @param {Object[]} rejectedWorks - Відхилені твори.
 * @returns {void}
 */
export function saveAllModerationWorks(
  pendingWorks,
  approvedWorks,
  rejectedWorks,
) {
  savePendingWorks(pendingWorks);
  saveApprovedWorks(approvedWorks);
  saveRejectedWorks(rejectedWorks);
}