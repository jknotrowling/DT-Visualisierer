from gray import map_decimal_to_symmetry_diagram_field 

# Testdaten
TEST_CASES = [
    {"input": 0, "n": 4, "expected": [0, 0]},
    {"input": 1, "n": 4, "expected": [0, 1]},
    {"input": 2, "n": 4, "expected": [1, 0]},
    {"input": 3, "n": 4, "expected": [1, 1]},
    {"input": 4, "n": 4, "expected": [0, 3]},
    {"input": 5, "n": 4, "expected": [0, 2]},
    {"input": 6, "n": 4, "expected": [1, 3]},
    {"input": 7, "n": 4, "expected": [1, 2]},
    {"input": 8, "n": 4, "expected": [3, 0]},
    {"input": 9, "n": 4, "expected": [3, 1]},
    {"input": 10, "n": 4, "expected": [2, 0]},
    {"input": 11, "n": 4, "expected": [2, 1]},
    {"input": 12, "n": 4, "expected": [3, 3]},
    {"input": 13, "n": 4, "expected": [3, 2]},
    {"input": 14, "n": 4, "expected": [2, 3]},
    {"input": 15, "n": 4, "expected": [2, 2]}
]

# Testlauf
for test_case in TEST_CASES:
    input_value = test_case["input"]
    n = test_case["n"]
    expected = test_case["expected"]

    result = map_decimal_to_symmetry_diagram_field(input_value, n)

    if result != expected:
        print(f"❌ Test failed for input {input_value} with n={n}: expected {expected}, got {result}")
    else:
        print(f"✅ Test passed for input {input_value} with n={n}: got {result}")
