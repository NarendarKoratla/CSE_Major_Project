import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


def ensure_dirs():
    base_dir = os.path.dirname(__file__)
    os.makedirs(os.path.join(base_dir, "data"), exist_ok=True)
    os.makedirs(os.path.join(base_dir, "models"), exist_ok=True)
    return base_dir


def maybe_generate_synthetic(csv_path: str):
    if os.path.exists(csv_path):
        return
    rng = np.random.default_rng(42)
    n = 1000
    age = rng.integers(5, 85, size=n)
    gender = rng.choice(["Male", "Female"], size=n)
    height = np.clip(rng.normal(165, 12, size=n), 90, 210)
    weight = np.clip(rng.normal(65, 15, size=n), 12, 180)
    bmi = weight / ((height / 100.0) ** 2)
    risk = (bmi > 30) | (bmi < 17) | ((age > 65) & (bmi < 20))
    y = risk.astype(int)
    df = pd.DataFrame({
        "age": age,
        "gender": gender,
        "height": height,
        "weight": weight,
        "label": y,
    })
    df.to_csv(csv_path, index=False)


def train_and_save(csv_path: str, model_name: str = "logreg"):
    df = pd.read_csv(csv_path)
    df["gender_num"] = (df["gender"] == "Male").astype(int)
    X = df[["age", "gender_num", "height", "weight"]].values.astype(float)
    y = df["label"].values.astype(int)

    if model_name == "rf":
        clf = RandomForestClassifier(n_estimators=200, random_state=42)
        pipe = Pipeline([
            ("clf", clf),
        ])
    else:
        clf = LogisticRegression(max_iter=1000)
        pipe = Pipeline([
            ("scaler", StandardScaler()),
            ("clf", clf),
        ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipe.fit(X_train, y_train)
    acc = pipe.score(X_test, y_test)

    base_dir = os.path.dirname(__file__)
    out_path = os.path.join(base_dir, "models", "model.joblib")
    joblib.dump(pipe, out_path)
    print(f"Saved {out_path} (test accuracy={acc:.3f})")
    return {
        "model_path": out_path,
        "accuracy": float(acc),
        "model": model_name,
        "num_samples": int(len(y)),
    }


if __name__ == "__main__":
    base = ensure_dirs()
    csv = sys.argv[1] if len(sys.argv) > 1 else os.path.join(base, "data", "dataset.csv")
    model = sys.argv[2] if len(sys.argv) > 2 else "logreg"  # options: logreg, rf
    maybe_generate_synthetic(csv)
    res = train_and_save(csv, model)
    print(res)


