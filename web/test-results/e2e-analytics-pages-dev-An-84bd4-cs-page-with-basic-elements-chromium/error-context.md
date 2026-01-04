# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Sign in to NextBestMove" [level=1] [ref=e5]
      - paragraph [ref=e6]: Enter your email to get started
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: Email
        - textbox "Email" [ref=e10]:
          - /placeholder: you@example.com
      - generic [ref=e11]:
        - generic [ref=e12]:
          - generic [ref=e13]: Password
          - link "Forgot password?" [ref=e14] [cursor=pointer]:
            - /url: /auth/forgot-password
        - textbox "Password" [ref=e15]:
          - /placeholder: ••••••••
      - button "Sign in" [ref=e16]
      - paragraph [ref=e17]:
        - text: Don't have an account?
        - link "Sign up" [ref=e18] [cursor=pointer]:
          - /url: /auth/sign-up
  - alert [ref=e19]
```