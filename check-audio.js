const urls = [
  "https://cdn.pixabay.com/download/audio/2022/01/21/audio_31743c58bb.mp3",
  "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
  "https://cdn.pixabay.com/download/audio/2021/11/25/audio_91b3cb81dd.mp3"
];

Promise.all(urls.map(u => fetch(u).then(r => console.log(u, r.status))));
