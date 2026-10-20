const payments = [
  { petName: "Chester", amount: 50, status: "APPROVED" },
  { petName: "Mochi", amount: 80, status: "PENDING" },
  { petName: "Mira", amount: 40, status: "DECLINED" }
];

const message = payments[1].petName + "'s payment status: " + payments[1].status;
console.log(message);

for (let i = 0; i < payments.length; i++) {
  switch (payments[i].status) {
    case "APPROVED":
      console.log("Pet-care service for " + payments[i].petName + " confirmed");
      break;
    case "PENDING":
      console.log("Payment for " + payments[i].petName + " is being processed");
      break;
    case "DECLINED":
      console.log("Payment for " + payments[i].petName + " unsuccessful");
      break;
    default:
      console.log("unknown status");
  }
}