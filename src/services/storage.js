export const readList = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

export const writeList = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    return
  }
}

export const readObject = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || null
  } catch {
    return null
  }
}

export const writeObject = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

export const notify = (event) => {
  try {
    window.dispatchEvent(new Event(event))
  } catch {
    return
  }
}
