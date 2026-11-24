# Lingo Daily Android 앱 (APK)

배포된 Lingo Daily 사이트를 전체 화면으로 여는 안드로이드 앱입니다(Trusted Web Activity). 화면과 기능은 사이트와 같고, 사이트를 고치면 앱도 바로 새 내용을 보여줍니다. 앱 아이콘·이름·사이트 주소를 바꿀 때만 다시 빌드합니다.

## 빌드

준비물: JDK 17 이상, Android SDK(platform 35, build-tools 35), 인터넷(dl.google.com, maven.google.com, Maven Central).

```bash
android/build-apk.sh https://<배포된 사이트 주소>
```

결과:

- `android/dist/lingo-daily.apk` — 가족에게 보낼 APK
- `web/downloads/lingo-daily.apk` — 사이트에서 `/downloads/lingo-daily.apk`로 내려받을 수 있게 하는 사본. 사이트 주소가 들어 있어 Git에는 올리지 않습니다.
- `web/.well-known/assetlinks.json` — 사이트가 이 앱을 공식 앱으로 인정하는 파일. 커밋하고 사이트를 다시 배포해야 앱 위쪽의 작은 주소 표시줄이 사라집니다.

## 서명 키 (중요)

처음 빌드할 때 `android/keystore/`에 서명 키와 비밀번호 파일이 만들어집니다. 이 폴더는 Git에 올리지 않습니다.

- 폴더를 비공개 장소(비밀번호 관리자, 개인 클라우드 등)에 백업하세요.
- 앱을 업데이트할 때는 같은 키로 빌드해야 합니다. 키를 잃어버리면 가족 휴대폰에서 기존 앱을 지우고 새로 설치해야 합니다. 학습 기록은 서버에 있어서 사라지지 않고, 다시 PIN으로 들어오면 됩니다.
- 다른 컴퓨터에서 빌드할 때는 백업한 폴더를 `android/keystore/`에 넣고 빌드하면 같은 키가 쓰입니다.

## 가족 휴대폰에 설치

1. 사이트의 `/install` 페이지를 안드로이드에서 열고 **Android 앱(APK) 받기**를 누릅니다. 또는 `android/dist/lingo-daily.apk` 파일을 직접 보냅니다.
2. 받은 파일을 엽니다. 처음이면 "출처를 알 수 없는 앱 설치"를 그 브라우저(또는 파일 앱)에 허용합니다.
3. 설치 후 Lingo Daily를 열고 자기 프로필과 PIN으로 들어갑니다.

Play 스토어 앱이 아니라서 설치할 때 Play 프로텍트 경고가 나올 수 있습니다. 앱은 휴대폰의 Chrome을 이용해 사이트를 열고, 별도 권한을 요청하지 않습니다.

## 패키지 정보

- 패키지 이름: `app.lingodaily.family`
- 최소 Android 7.0 (API 24), 대상 API 35
- 버전: 빌드할 때의 날짜·시간으로 자동 증가
