# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Sign in to NextBestMove" [level=1] [ref=e5]
      - paragraph [ref=e6]: Enter your email to get started
    - generic [ref=e7]:
      - generic [ref=e8]: Invalid login credentials
      - generic [ref=e9]:
        - generic [ref=e10]: Email
        - textbox "Email" [ref=e11]:
          - /placeholder: you@example.com
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: Password
          - link "Forgot password?" [ref=e15] [cursor=pointer]:
            - /url: /auth/forgot-password
        - textbox "Password" [ref=e16]:
          - /placeholder: ••••••••
      - button "Sign in" [ref=e17]
      - paragraph [ref=e18]:
        - text: Don't have an account?
        - link "Sign up" [ref=e19] [cursor=pointer]:
          - /url: /auth/sign-up
  - alert [ref=e20]
```